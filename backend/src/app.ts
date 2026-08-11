import express from "express";
import type { ErrorRequestHandler } from "express";
import cors from "cors";
import { config } from "./config";
import { ensureDatabase } from "./db";
import healthRoutes from "./routes/health";
import boardRoutes from "./routes/board";
import taskRoutes from "./routes/tasks";

const app = express();

app.use(
  cors({
    origin: config.frontendOrigins,
  }),
);

app.use(express.json());

app.use((req, res, next) => {
  void ensureDatabase()
    .then(() => next())
    .catch(next);
});

app.use("/api", healthRoutes);
app.use("/api", boardRoutes);
app.use("/api", taskRoutes);

app.get("/", (_req, res) => {
  res.json({
    service: "task-management-board-api",
    health: "/api/health",
    board: "/api/board",
  });
});

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

const jsonErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "Request body must be valid JSON." });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
};

app.use(jsonErrorHandler);

export default app;
