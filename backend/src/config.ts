// =============================================================================
// CONFIG
// One place to read environment variables. The rest of the app imports this.
// process.env.NAME comes from the .env file (loaded in index.ts).
// =============================================================================

import path from "node:path";

export interface Config {
  port: number;
  databasePath: string;
  frontendOrigin: string;
}

export const config: Config = {
  port: Number(process.env.PORT) || 4000,
  // A file path, not a server address. SQLite is just a file on disk.
  databasePath:
    process.env.DATABASE_PATH ??
    path.join(__dirname, "..", "data", "board.db"),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
};
