import express from "express";
import type { ErrorRequestHandler } from "express";
import cors from "cors";
import { config } from "./config";
import { describeError } from "./db";
import healthRoutes from "./routes/health";
import boardRoutes from "./routes/board";
import columnRoutes from "./routes/columns";
import taskRoutes from "./routes/tasks";
import authRoutes from "./routes/auth";

const app = express();

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (config.frontendOrigins.includes(origin)) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;
  // Any Vercel preview/prod URL can call the API (this app only).
  if (config.isVercel && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
    return true;
  }
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    },
  }),
);

app.use(express.json());

// Health must not wait on a database migrate — that is what made
// /api/health spin forever on Vercel when Neon/SQLite failed to open.
app.use("/api", healthRoutes);
app.use("/api", authRoutes);
app.use("/api", boardRoutes);
app.use("/api", columnRoutes);
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
  res.status(500).json({ error: describeError(err) || "Unexpected server error." });
};

app.use(jsonErrorHandler);

export default app;
