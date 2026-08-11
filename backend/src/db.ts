// =============================================================================
// DATABASE CONNECTION
//
// What is happening here?
// 1. SQLite is a SQL database stored as one file (backend/data/board.db).
// 2. Node 22+ ships `node:sqlite`, so we do not install Postgres or Docker.
// 3. `query()` is the only function the rest of the app should call.
//
// SQL is just text. Example:
//   query<Task>("SELECT * FROM tasks WHERE id = $1", [42])
// $1 is a placeholder. Never glue user input into SQL with + or template
// strings — that is how SQL injection happens. Always use $1, $2, ...
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { config } from "./config";

export type SqlValue = null | number | string | bigint;

export interface QueryResult<T> {
  rows: T[];
}

const dataDir = path.dirname(config.databasePath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const connection = new DatabaseSync(config.databasePath);
connection.exec("PRAGMA foreign_keys = ON");

function toSqlite(text: string): string {
  // Routes use $1, $2 (common SQL style). SQLite wants ? ? instead.
  return text.replace(/\$\d+/g, "?");
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

export function query<T>(text: string, params: SqlValue[] = []): QueryResult<T> {
  const sql = toSqlite(text);
  const start = Date.now();
  const statement = connection.prepare(sql);
  const returnsRows = /^\s*SELECT/i.test(sql) || /RETURNING/i.test(sql);
  const rows = returnsRows ? (statement.all(...params) as T[]) : [];
  if (!returnsRows) {
    statement.run(...params);
  }
  const ms = Date.now() - start;
  const preview = text.split("\n")[0] ?? text;
  console.log(`SQL ${ms}ms · ${preview.slice(0, 80)}`);
  return { rows };
}

export function ping(): void {
  query("SELECT 1");
}

function applySqlFile(filename: string): void {
  const filePath = path.join(__dirname, "..", "sql", filename);
  connection.exec(fs.readFileSync(filePath, "utf8"));
}

export function migrate(): void {
  applySqlFile("schema.sql");
  const count = query<{ n: number | bigint }>("SELECT COUNT(*) AS n FROM boards");
  const total = Number(count.rows[0]?.n ?? 0);
  if (total === 0) {
    applySqlFile("seed.sql");
    console.log("Seeded sample board into", config.databasePath);
  }
}

migrate();
