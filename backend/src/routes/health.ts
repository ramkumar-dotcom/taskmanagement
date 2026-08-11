// GET /api/health
// A "health check" is a tiny endpoint hosts use to ask: is this server alive?

import { Router } from "express";
import type { HealthResponse } from "@tmb/shared";
import { describeError, ping } from "../db";

const router = Router();

router.get("/health", (_req, res) => {
  try {
    ping();
    const body: HealthResponse = {
      ok: true,
      service: "task-management-board-api",
      database: "connected",
    };
    res.json(body);
  } catch (err) {
    const body: HealthResponse = {
      ok: false,
      service: "task-management-board-api",
      database: "disconnected",
      error: describeError(err),
    };
    res.status(503).json(body);
  }
});

export default router;
