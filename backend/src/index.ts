// =============================================================================
// BACKEND ENTRY POINT
//
// This file starts the Node.js server.
//
// Request path (remember this picture):
//
//   Browser (Next.js page on :3000)
//        |
//        |  HTTP request  (fetch)
//        v
//   Express (this file, on :4000)
//        |
//        |  SQL query
//        v
//   SQLite file (backend/data/board.db)
//
// Express is a tiny library that says: "when a request hits this URL,
// run this function and send a response."
// =============================================================================

import "dotenv/config";
import express from "express";
import type { ErrorRequestHandler } from "express";
import cors from "cors";
import { config } from "./config";
import healthRoutes from "./routes/health";
import boardRoutes from "./routes/board";
import taskRoutes from "./routes/tasks";

const app = express();

// CORS = Cross-Origin Resource Sharing.
// The browser blocks frontend :3000 from talking to backend :4000 unless
// the backend explicitly allows that origin.
app.use(
  cors({
    origin: config.frontendOrigin,
  }),
);

// Parse JSON bodies so req.body.title works in the task routes.
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api", boardRoutes);
app.use("/api", taskRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

// Express would otherwise dump an HTML page for bad JSON. Return JSON instead.
const jsonErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "Request body must be valid JSON." });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
};

app.use(jsonErrorHandler);

app.listen(config.port, () => {
  console.log("");
  console.log("  Task Management Board API");
  console.log(`  Listening on http://localhost:${config.port}`);
  console.log(`  Health check: http://localhost:${config.port}/api/health`);
  console.log(`  Board data:   http://localhost:${config.port}/api/board`);
  console.log(`  SQLite file:  ${config.databasePath}`);
  console.log("");
});
