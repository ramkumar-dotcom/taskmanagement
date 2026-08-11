// GET /api/health
// A "health check" is a tiny endpoint hosts use to ask: is this server alive?

import { Router } from "express";
import type { HealthResponse } from "@tmb/shared";
import { config } from "../config";
import { describeError, ping } from "../db";

const router = Router();

router.get("/health", async (_req, res) => {
  try {
    await ping();
    const body: HealthResponse = {
      ok: true,
      service: "task-management-board-api",
      database: "connected",
      driver: config.driver,
    };
    res.json(body);
  } catch (err) {
    const body: HealthResponse = {
      ok: false,
      service: "task-management-board-api",
      database: "disconnected",
      driver: config.driver,
      error: describeError(err),
    };
    res.status(503).json(body);
  }
});

export default router;
