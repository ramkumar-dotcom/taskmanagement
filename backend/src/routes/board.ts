// GET /api/board
// Returns the first board, its columns, and every task — the shape the
// Next.js page needs to draw a kanban board in one request.

import { Router } from "express";
import type { Board, BoardWithColumns, Column, Task } from "@tmb/shared";
import { query } from "../db";

const router = Router();

router.get("/board", (_req, res) => {
  try {
    const boardResult = query<Board>(
      "SELECT id, name, created_at FROM boards ORDER BY id ASC LIMIT 1",
    );

    const board = boardResult.rows[0];
    if (!board) {
      res.status(404).json({
        error: "No board found. Run: npm run db:setup  (inside backend/)",
      });
      return;
    }

    const columnsResult = query<Column>(
      `SELECT id, board_id, name, position
       FROM columns
       WHERE board_id = $1
       ORDER BY position ASC`,
      [board.id],
    );

    const tasksResult = query<Task>(
      `SELECT t.id, t.column_id, t.title, t.description, t.position, t.created_at
       FROM tasks t
       JOIN columns c ON c.id = t.column_id
       WHERE c.board_id = $1
       ORDER BY t.position ASC, t.id ASC`,
      [board.id],
    );

    const payload: BoardWithColumns = {
      ...board,
      columns: columnsResult.rows.map((column) => ({
        ...column,
        tasks: tasksResult.rows.filter((task) => task.column_id === column.id),
      })),
    };

    res.json(payload);
  } catch (err) {
    console.error("GET /api/board failed:", err);
    res.status(500).json({ error: "Could not load the board." });
  }
});

export default router;
