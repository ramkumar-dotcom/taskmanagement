// =============================================================================
// DATABASE SETUP / RESET
//
// The API already creates tables the first time it starts.
// Use this script only when you want a clean board again.
//
//   npm run db:setup          create tables + sample cards if missing
//   npm run db:reset          wipe, then create + seed again
//
// Local SQLite: deletes backend/data/board.db
// Neon/Postgres: DROP TABLE ... then re-seed (needs DATABASE_URL)
// =============================================================================

import "dotenv/config";
import { config } from "../src/config";
import { ensureDatabase, resetDatabase } from "../src/db";

async function main(): Promise<void> {
  const reset = process.argv.includes("--reset");

  if (reset) {
    await resetDatabase();
    console.log(
      config.driver === "postgres"
        ? "Reset Neon / Postgres tables."
        : `Reset SQLite file: ${config.databasePath}`,
    );
    return;
  }

  await ensureDatabase();
  console.log(
    config.driver === "postgres"
      ? "Postgres is ready (DATABASE_URL)."
      : `Database is ready: ${config.databasePath}`,
  );
}

void main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
