// =============================================================================
// DATABASE CONNECTION
//
// Local (no DATABASE_URL): SQLite file at backend/data/board.db
// Production (Neon):       Postgres via DATABASE_URL
//
// Routes always call query() with $1, $2 placeholders. This file adapts
// that to whichever database is configured.
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Pool } from "pg";
import { config } from "./config";
import {
  postgresSchema,
  postgresSequenceFix,
  seedSql,
  sqliteSchema,
} from "./sql-scripts";

export type SqlValue = null | number | string | bigint;

export interface QueryResult<T> {
  rows: T[];
}

let sqlite: DatabaseSync | undefined;
let postgres: Pool | undefined;
let migratePromise: Promise<void> | undefined;

function needsSsl(url: string): boolean {
  return url.includes("neon.tech") || url.includes("sslmode=require");
}

function getSqlite(): DatabaseSync {
  if (!sqlite) {
    const dataDir = path.dirname(config.databasePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    sqlite = new DatabaseSync(config.databasePath);
    sqlite.exec("PRAGMA foreign_keys = ON");
  }
  return sqlite;
}

function getPostgres(): Pool {
  if (!postgres) {
    if (!config.databaseUrl) {
      throw new Error("DATABASE_URL is missing");
    }
    postgres = new Pool({
      connectionString: config.databaseUrl,
      max: 1,
      ssl: needsSsl(config.databaseUrl) ? { rejectUnauthorized: false } : undefined,
    });
  }
  return postgres;
}

function toSqlite(text: string): string {
  return text.replace(/\$\d+/g, "?");
}

function normalizeRow<T>(row: Record<string, unknown>): T {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      next[key] = value.toISOString();
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
    const result = await getPostgres().query<Record<string, unknown>>(text, params);
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

export function nowSql(): string {
  return config.driver === "postgres" ? "NOW()" : "datetime('now')";
}

export async function resetDatabase(): Promise<void> {
  if (config.driver === "postgres") {
    await getPostgres().query("DROP TABLE IF EXISTS tasks, columns, boards CASCADE");
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
    const pool = getPostgres();
    await pool.query(postgresSchema);
    const count = await query<{ n: number | string }>("SELECT COUNT(*) AS n FROM boards");
    if (Number(count.rows[0]?.n ?? 0) === 0) {
      await pool.query(seedSql);
      await pool.query(postgresSequenceFix);
      console.log("Seeded sample board into Neon / Postgres");
    }
    return;
  }

  getSqlite().exec(sqliteSchema);
  const count = await query<{ n: number | string }>("SELECT COUNT(*) AS n FROM boards");
  if (Number(count.rows[0]?.n ?? 0) === 0) {
    getSqlite().exec(seedSql);
    console.log("Seeded sample board into", config.databasePath);
  }
}

export function ensureDatabase(): Promise<void> {
  if (!migratePromise) {
    migratePromise = migrate();
  }
  return migratePromise;
}
