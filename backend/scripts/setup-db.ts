// =============================================================================
// DATABASE SETUP / RESET
//
// The API already creates tables the first time it starts.
// Use this script only when you want a clean board again.
//
// Usage (from backend/):
//   npm run db:setup          create tables + sample cards if missing
//   npm run db:reset          delete the .db file, then create + seed again
// =============================================================================

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

const databasePath =
  process.env.DATABASE_PATH ?? path.join(__dirname, "..", "data", "board.db");
const reset = process.argv.includes("--reset");

async function main(): Promise<void> {
  if (reset && fs.existsSync(databasePath)) {
    fs.unlinkSync(databasePath);
    console.log("Deleted", databasePath);
  }

  // Import after a possible delete so migrate() sees a fresh file.
  await import("../src/db");
  console.log("Database is ready:", databasePath);
}

void main();
