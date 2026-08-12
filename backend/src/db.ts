// =============================================================================
// DATABASE CONNECTION
//
// Local (no DATABASE_URL): SQLite file at backend/data/board.db
// Production (Neon on Vercel): HTTP driver — TCP `pg` hangs in serverless.
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import { config } from "./config";
import {
  addBoardOwnerSql,
  addTaskDatesSql,
  addTaskLabelsSql,
  addTaskPrioritySql,
  postgresSchema,
  postgresSequenceFix,
  removeDemoTasksSql,
  seedSql,
  sqliteSchema,
} from "./sql-scripts";

export type SqlValue = null | number | string | bigint;

export interface QueryResult<T> {
  rows: T[];
}

type SqlClient = {
  query: (
    text: string,
    params?: SqlValue[],
  ) => Promise<{ rows: Record<string, unknown>[] }>;
};

type SqliteConnection = {
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    all: (...params: SqlValue[]) => unknown[];
    run: (...params: SqlValue[]) => void;
  };
  close: () => void;
};

let sqlite: SqliteConnection | undefined;
let postgres: SqlClient | undefined;
let migratePromise: Promise<void> | undefined;

function isNeonUrl(url: string): boolean {
  return url.includes("neon.tech") || url.includes("neon.local");
}

function getSqlite(): SqliteConnection {
  if (config.isVercel) {
    throw new Error("SQLite cannot run on Vercel. Set DATABASE_URL to your Neon pooled URI.");
  }
  if (!sqlite) {
    // Loaded only on a real machine. Importing node:sqlite on Vercel crashes the function.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");
    const dataDir = path.dirname(config.databasePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    sqlite = new DatabaseSync(config.databasePath);
    sqlite.exec("PRAGMA foreign_keys = ON");
  }
  return sqlite;
}

async function getPostgres(): Promise<SqlClient> {
  if (!postgres) {
    if (!config.databaseUrl) {
      throw new Error("DATABASE_URL is missing");
    }

    if (isNeonUrl(config.databaseUrl)) {
      const { neonConfig, Pool } = await import("@neondatabase/serverless");
      neonConfig.poolQueryViaFetch = true;
      postgres = new Pool({ connectionString: config.databaseUrl });
    } else {
      const { Pool } = await import("pg");
      postgres = new Pool({
        connectionString: config.databaseUrl,
        max: 1,
        connectionTimeoutMillis: 5000,
        ssl: config.databaseUrl.includes("sslmode=require")
          ? { rejectUnauthorized: false }
          : undefined,
      });
    }
  }
  return postgres;
}

function toSqlite(text: string): string {
  return text.replace(/\$\d+/g, "?");
}

const KNOWN_LABELS = new Set(["bug", "feature", "design", "docs", "chore"]);

function parseStoredLabels(value: unknown): string[] {
  let raw: unknown = value;
  if (typeof value === "string") {
    try {
      raw = JSON.parse(value) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string" && KNOWN_LABELS.has(item));
}

function normalizeRow<T>(row: Record<string, unknown>): T {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      next[key] = key.endsWith("_date")
        ? value.toISOString().slice(0, 10)
        : value.toISOString();
    } else if (typeof value === "string" && key.endsWith("_date")) {
      next[key] = value.slice(0, 10);
    } else if (key === "labels") {
      next[key] = parseStoredLabels(value);
    } else if (typeof value === "bigint") {
      next[key] = Number(value);
    } else {
      next[key] = value;
    }
  }
  return next as T;
}

export function describeError(err: unknown): string {
  if (err && typeof err === "object" && "errors" in err) {
    const nested = (err as { errors?: unknown[] }).errors;
    if (Array.isArray(nested) && nested.length > 0) {
      return nested
        .map((item) => {
          if (item instanceof Error) return item.message;
          if (item && typeof item === "object" && "code" in item) {
            return String((item as { code: unknown }).code);
          }
          return "unknown error";
        })
        .join("; ");
    }
  }

  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: unknown }).code);
  }
  return "unknown database error";
}

export async function query<T>(
  text: string,
  params: SqlValue[] = [],
): Promise<QueryResult<T>> {
  const start = Date.now();
  let rows: T[];

  if (config.driver === "postgres") {
    const result = await (await getPostgres()).query(text, params);
    rows = result.rows.map((row) => normalizeRow<T>(row));
  } else {
    const sql = toSqlite(text);
    const statement = getSqlite().prepare(sql);
    const returnsRows = /^\s*SELECT/i.test(sql) || /RETURNING/i.test(sql);
    if (returnsRows) {
      rows = (statement.all(...params) as Record<string, unknown>[]).map((row) =>
        normalizeRow<T>(row),
      );
    } else {
      statement.run(...params);
      rows = [];
    }
  }

  const ms = Date.now() - start;
  const preview = text.split("\n")[0] ?? text;
  console.log(`SQL ${config.driver} ${ms}ms · ${preview.slice(0, 80)}`);
  return { rows };
}

export async function ping(): Promise<void> {
  await query("SELECT 1");
}

async function execStatements(sql: string): Promise<void> {
  const client = await getPostgres();
  const statements = sql
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  for (const statement of statements) {
    await client.query(statement);
  }
}

export function nowSql(): string {
  return config.driver === "postgres" ? "NOW()" : "datetime('now')";
}

export async function resetDatabase(): Promise<void> {
  if (config.driver === "postgres") {
    await (await getPostgres()).query("DROP TABLE IF EXISTS tasks, columns, boards CASCADE");
  } else if (sqlite) {
    sqlite.close();
    sqlite = undefined;
  }

  if (config.driver === "sqlite" && fs.existsSync(config.databasePath)) {
    fs.unlinkSync(config.databasePath);
  }

  migratePromise = undefined;
  await ensureDatabase();
}

async function migrate(): Promise<void> {
  if (config.driver === "postgres") {
    await execStatements(postgresSchema);
    try {
      await execStatements(addBoardOwnerSql);
    } catch {
      // column may already exist
    }
    try {
      await execStatements(addTaskDatesSql);
    } catch {
      // columns may already exist
    }
    try {
      await execStatements(addTaskPrioritySql);
    } catch {
      // column may already exist
    }
    try {
      await execStatements(addTaskLabelsSql);
    } catch {
      // column may already exist
    }
    const count = await query<{ n: number | string }>("SELECT COUNT(*) AS n FROM boards");
    if (Number(count.rows[0]?.n ?? 0) === 0) {
      await execStatements(seedSql);
      await execStatements(postgresSequenceFix);
      console.log("Seeded empty board into Neon / Postgres");
    }
    await execStatements(removeDemoTasksSql);
    return;
  }

  getSqlite().exec(sqliteSchema);
  try {
    getSqlite().exec("ALTER TABLE boards ADD COLUMN user_id INTEGER");
  } catch {
    // column may already exist
  }
  for (const column of ["due_date", "start_date", "completed_date"]) {
    try {
      getSqlite().exec(`ALTER TABLE tasks ADD COLUMN ${column} TEXT`);
    } catch {
      // column may already exist
    }
  }
  try {
    getSqlite().exec(`ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'`);
  } catch {
    // column may already exist
  }
  try {
    getSqlite().exec(`ALTER TABLE tasks ADD COLUMN labels TEXT NOT NULL DEFAULT '[]'`);
  } catch {
    // column may already exist
  }
  const count = await query<{ n: number | string }>("SELECT COUNT(*) AS n FROM boards");
  if (Number(count.rows[0]?.n ?? 0) === 0) {
    getSqlite().exec(seedSql);
    console.log("Seeded empty board into", config.databasePath);
  }
  getSqlite().exec(removeDemoTasksSql);
}

export function ensureDatabase(): Promise<void> {
  if (!migratePromise) {
    migratePromise = migrate().catch((err) => {
      migratePromise = undefined;
      throw err;
    });
  }
  return migratePromise;
}
