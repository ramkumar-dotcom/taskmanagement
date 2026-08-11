// =============================================================================
// BACKEND ENTRY POINT
//
// Local:  `npm run dev` calls app.listen on PORT (4000).
// Vercel: this file is the Express app. Do not listen — export the app.
//
//   Browser → Next.js (Vercel) → Express (Vercel) → Neon Postgres
// =============================================================================

import "dotenv/config";
import app from "./app";
import { config } from "./config";

export default app;

if (!config.isVercel) {
  app.listen(config.port, () => {
    console.log("");
    console.log("  Task Management Board API");
    console.log(`  Listening on http://localhost:${config.port}`);
    console.log(`  Health check: http://localhost:${config.port}/api/health`);
    console.log(`  Board data:   http://localhost:${config.port}/api/board`);
    console.log(
      config.driver === "postgres"
        ? "  Database:     Postgres (DATABASE_URL)"
        : `  SQLite file:  ${config.databasePath}`,
    );
    console.log("");
  });
}
