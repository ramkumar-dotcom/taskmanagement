import { Router } from "express";
import type { Board } from "@tmb/shared";
import { createBoardWithColumns, loadBoardById } from "../board-service";
import { describeError, ensureDatabase, query } from "../db";

const router = Router();

function asUserId(value: unknown): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.get("/boards", async (req, res) => {
  const userId = asUserId(req.query.userId);
  if (!userId) {
    res.status(400).json({ error: "userId is required." });
    return;
  }

  try {
    try {
      await ensureDatabase();
    } catch {
      // continue
    }
    const result = await query<Board>(
      `SELECT id, name, created_at
       FROM boards
       WHERE user_id = $1
       ORDER BY id ASC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/boards failed:", err);
    res.status(500).json({ error: describeError(err) });
  }
});

router.post("/boards", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const userId = asUserId(req.body?.userId);
  if (!name) {
    res.status(400).json({ error: "Board name is required." });
    return;
  }
  if (!userId) {
    res.status(400).json({ error: "userId is required." });
    return;
  }

  try {
    try {
      await ensureDatabase();
    } catch {
      // continue
    }
    const user = await query<{ id: number }>("SELECT id FROM users WHERE id = $1", [userId]);
    if (user.rows.length === 0) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    const board = await createBoardWithColumns(name, userId);
    res.status(201).json(board);
  } catch (err) {
    console.error("POST /api/boards failed:", err);
    res.status(500).json({ error: describeError(err) });
  }
});

router.get("/boards/:id", async (req, res) => {
  const boardId = Number(req.params.id);
  if (!Number.isInteger(boardId)) {
    res.status(400).json({ error: "invalid board id" });
    return;
  }

  try {
    try {
      await ensureDatabase();
    } catch {
      // continue
    }
    const board = await loadBoardById(boardId);
    if (!board) {
      res.status(404).json({ error: "Board not found." });
      return;
    }
    res.json(board);
  } catch (err) {
    console.error("GET /api/boards/:id failed:", err);
    res.status(500).json({ error: describeError(err) });
  }
});

router.get("/board", async (_req, res) => {
  try {
    try {
      await ensureDatabase();
    } catch (migrateErr) {
      console.error("migrate failed, reading tables anyway:", migrateErr);
    }

    const boardResult = await query<Board>(
      "SELECT id, name, created_at FROM boards ORDER BY id ASC LIMIT 1",
    );
    const first = boardResult.rows[0];
    if (!first) {
      res.status(404).json({ error: "No board found." });
      return;
    }
    const board = await loadBoardById(first.id);
    if (!board) {
      res.status(404).json({ error: "No board found." });
      return;
    }
    res.json(board);
  } catch (err) {
    console.error("GET /api/board failed:", err);
    res.status(500).json({ error: describeError(err) });
  }
});

export default router;
