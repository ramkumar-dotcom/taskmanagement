// Task routes — create, move, delete.
// These are the only write operations the boilerplate needs.

import { Router } from "express";
import type { Request, Response } from "express";
import type { Task } from "@tmb/shared";
import { query } from "../db";
import type { SqlValue } from "../db";

const router = Router();

interface CreateTaskBody {
  title?: unknown;
  description?: unknown;
  columnId?: unknown;
}

interface UpdateTaskBody {
  title?: unknown;
  description?: unknown;
  columnId?: unknown;
}

function badRequest(res: Response, message: string): void {
  res.status(400).json({ error: message });
}

function asTrimmedString(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : null;
}

// POST /api/tasks
// Body: { title, description?, columnId }
router.post("/tasks", (req: Request<object, unknown, CreateTaskBody>, res) => {
  const title = asTrimmedString(req.body.title) ?? "";
  const description = asTrimmedString(req.body.description) ?? "";
  const columnId = Number(req.body.columnId);

  if (!title) {
    badRequest(res, "title is required");
    return;
  }
  if (!Number.isInteger(columnId)) {
    badRequest(res, "columnId must be a number");
    return;
  }

  try {
    const column = query<{ id: number }>("SELECT id FROM columns WHERE id = $1", [columnId]);
    if (column.rows.length === 0) {
      badRequest(res, "column does not exist");
      return;
    }

    const positionResult = query<{ next_position: number }>(
      "SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM tasks WHERE column_id = $1",
      [columnId],
    );

    const nextPosition = positionResult.rows[0]?.next_position ?? 0;

    const created = query<Task>(
      `INSERT INTO tasks (column_id, title, description, position)
       VALUES ($1, $2, $3, $4)
       RETURNING id, column_id, title, description, position, created_at`,
      [columnId, title, description || null, nextPosition],
    );

    const task = created.rows[0];
    if (!task) {
      res.status(500).json({ error: "Could not create the task." });
      return;
    }

    res.status(201).json(task);
  } catch (err) {
    console.error("POST /api/tasks failed:", err);
    res.status(500).json({ error: "Could not create the task." });
  }
});

// PATCH /api/tasks/:id
// Body can include title, description, and/or columnId (to move the card).
router.patch(
  "/tasks/:id",
  (req: Request<{ id: string }, unknown, UpdateTaskBody>, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      badRequest(res, "invalid task id");
      return;
    }

    const updates: string[] = [];
    const values: SqlValue[] = [];

    if (typeof req.body.title === "string") {
      const title = req.body.title.trim();
      if (!title) {
        badRequest(res, "title cannot be empty");
        return;
      }
      values.push(title);
      updates.push(`title = $${values.length}`);
    }

    if (typeof req.body.description === "string") {
      values.push(req.body.description.trim() || null);
      updates.push(`description = $${values.length}`);
    }

    if (req.body.columnId !== undefined) {
      const columnId = Number(req.body.columnId);
      if (!Number.isInteger(columnId)) {
        badRequest(res, "columnId must be a number");
        return;
      }
      values.push(columnId);
      updates.push(`column_id = $${values.length}`);
    }

    if (updates.length === 0) {
      badRequest(res, "nothing to update");
      return;
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    try {
      const result = query<Task>(
        `UPDATE tasks
         SET ${updates.join(", ")}
         WHERE id = $${values.length}
         RETURNING id, column_id, title, description, position, created_at`,
        values,
      );

      const task = result.rows[0];
      if (!task) {
        res.status(404).json({ error: "task not found" });
        return;
      }

      res.json(task);
    } catch (err) {
      console.error("PATCH /api/tasks/:id failed:", err);
      res.status(500).json({ error: "Could not update the task." });
    }
  },
);

// DELETE /api/tasks/:id
router.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    badRequest(res, "invalid task id");
    return;
  }

  try {
    const result = query<{ id: number }>("DELETE FROM tasks WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "task not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/tasks/:id failed:", err);
    res.status(500).json({ error: "Could not delete the task." });
  }
});

export default router;
