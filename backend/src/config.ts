// =============================================================================
// CONFIG
// One place to read environment variables. The rest of the app imports this.
// process.env.NAME comes from the .env file (local) or the Vercel dashboard.
// =============================================================================

import path from "node:path";

export type DatabaseDriver = "sqlite" | "postgres";

export interface Config {
  port: number;
  driver: DatabaseDriver;
  databaseUrl: string | undefined;
  databasePath: string;
  frontendOrigins: string[];
  isVercel: boolean;
}

function parseOrigins(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function detectDriver(databaseUrl: string | undefined): DatabaseDriver {
  if (!databaseUrl) return "sqlite";
  if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
    return "postgres";
  }
  return "sqlite";
}

const databaseUrl = process.env.DATABASE_URL;

export const config: Config = {
  port: Number(process.env.PORT) || 4000,
  driver: detectDriver(databaseUrl),
  databaseUrl,
  databasePath:
    process.env.DATABASE_PATH ??
    path.join(__dirname, "..", "data", "board.db"),
  frontendOrigins: parseOrigins(
    process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
  ),
  isVercel: process.env.VERCEL === "1",
};

if (config.isVercel && config.driver !== "postgres") {
  console.warn(
    "VERCEL is set but DATABASE_URL is not a Postgres URL. Set the Neon pooled connection string or cards will not persist.",
  );
}
