// Task routes — create, move, delete.
// These are the write operations the board needs.

import { Router } from "express";
import type { Request, Response } from "express";
import type { Task, TaskLabel, TaskPriority } from "@tmb/shared";
import { duplicateTask } from "../board-service";
import { ensureDatabase, nowSql, query } from "../db";
import type { SqlValue } from "../db";

const router = Router();

const TASK_FIELDS =
  "id, column_id, title, description, position, created_at, due_date, start_date, completed_date, priority, labels";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface CreateTaskBody {
  title?: unknown;
  description?: unknown;
  columnId?: unknown;
  dueDate?: unknown;
  startDate?: unknown;
  completedDate?: unknown;
  priority?: unknown;
  labels?: unknown;
}

interface UpdateTaskBody {
  title?: unknown;
  description?: unknown;
  columnId?: unknown;
  position?: unknown;
  dueDate?: unknown;
  startDate?: unknown;
  completedDate?: unknown;
  priority?: unknown;
  labels?: unknown;
}

function badRequest(res: Response, message: string): void {
  res.status(400).json({ error: message });
}

function asTrimmedString(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : null;
}

function todayDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function parsePriority(value: unknown): TaskPriority {
  if (value === "low" || value === "medium" || value === "high") return value;
  throw new Error("priority must be low, medium, or high");
}

function parseLabels(value: unknown): TaskLabel[] {
  if (!Array.isArray(value)) {
    throw new Error("labels must be an array");
  }
  const unique = new Set<TaskLabel>();
  for (const item of value) {
    if (item !== "bug" && item !== "feature" && item !== "design" && item !== "docs" && item !== "chore") {
      throw new Error("labels must be bug, feature, design, docs, or chore");
    }
    unique.add(item);
  }
  return [...unique];
}

function parseDateInput(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value === "string" && DATE_RE.test(value)) return value;
  throw new Error(`${field} must be YYYY-MM-DD`);
}

function isDoneName(name: string): boolean {
  return name.trim().toLowerCase() === "done";
}

function isInProgressName(name: string): boolean {
  return name.trim().toLowerCase() === "in progress";
}

function applyColumnMoveDates(
  task: Pick<Task, "start_date" | "completed_date">,
  destColumnName: string,
): Pick<Task, "start_date" | "completed_date"> {
  const dest = destColumnName.trim().toLowerCase();
  if (dest === "to do") {
    return { start_date: null, completed_date: null };
  }
  if (dest === "in progress") {
    return {
      start_date: task.start_date ?? todayDate(),
      completed_date: null,
    };
  }
  if (dest === "done") {
    return {
      start_date: task.start_date,
      completed_date: task.completed_date ?? todayDate(),
    };
  }
  return { start_date: task.start_date, completed_date: task.completed_date };
}

// POST /api/tasks
// Body: { title, description?, columnId }
router.post("/tasks", async (req: Request<object, unknown, CreateTaskBody>, res) => {
  const title = asTrimmedString(req.body.title) ?? "";
  const description = asTrimmedString(req.body.description) ?? "";
  const columnId = Number(req.body.columnId);
  let dueDate: string | null = null;
  let startDate: string | null = null;
  let completedDate: string | null = null;
  let priority: TaskPriority = "medium";
  let labels: TaskLabel[] = [];

  if (!title) {
    badRequest(res, "title is required");
    return;
  }
  if (!Number.isInteger(columnId)) {
    badRequest(res, "columnId must be a number");
    return;
  }

  try {
    dueDate = parseDateInput(req.body.dueDate, "dueDate") ?? null;
    startDate = parseDateInput(req.body.startDate, "startDate") ?? null;
    completedDate = parseDateInput(req.body.completedDate, "completedDate") ?? null;
    if (req.body.priority !== undefined) {
      priority = parsePriority(req.body.priority);
    }
    if (req.body.labels !== undefined) {
      labels = parseLabels(req.body.labels);
    }
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : "Invalid date");
    return;
  }

  try {
    try {
      await ensureDatabase();
    } catch {
      // Tables may already exist.
    }
    const column = await query<{ id: number; name: string }>(
      "SELECT id, name FROM columns WHERE id = $1",
      [columnId],
    );
    if (column.rows.length === 0) {
      badRequest(res, "column does not exist");
      return;
    }

    const columnName = column.rows[0]?.name ?? "";
    if (isInProgressName(columnName) && !startDate) {
      startDate = todayDate();
    }
    if (isDoneName(columnName) && !completedDate) {
      completedDate = todayDate();
    }

    const positionResult = await query<{ next_position: number | string }>(
      "SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM tasks WHERE column_id = $1",
      [columnId],
    );

    const nextPosition = Number(positionResult.rows[0]?.next_position ?? 0);

    const created = await query<Task>(
      `INSERT INTO tasks (column_id, title, description, position, due_date, start_date, completed_date, priority, labels)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING ${TASK_FIELDS}`,
      [
        columnId,
        title,
        description || null,
        nextPosition,
        dueDate,
        startDate,
        completedDate,
        priority,
        JSON.stringify(labels),
      ],
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
  async (req: Request<{ id: string }, unknown, UpdateTaskBody>, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      badRequest(res, "invalid task id");
      return;
    }

    const updates: string[] = [];
    const values: SqlValue[] = [];

    let dueDate: string | null | undefined;
    let startDate: string | null | undefined;
    let completedDate: string | null | undefined;
    let priority: TaskPriority | undefined;
    let labels: TaskLabel[] | undefined;
    try {
      dueDate = parseDateInput(req.body.dueDate, "dueDate");
      startDate = parseDateInput(req.body.startDate, "startDate");
      completedDate = parseDateInput(req.body.completedDate, "completedDate");
      if (req.body.priority !== undefined) {
        priority = parsePriority(req.body.priority);
      }
      if (req.body.labels !== undefined) {
        labels = parseLabels(req.body.labels);
      }
    } catch (err) {
      badRequest(res, err instanceof Error ? err.message : "Invalid date");
      return;
    }

    const editingContent =
      typeof req.body.title === "string" ||
      typeof req.body.description === "string" ||
      dueDate !== undefined ||
      startDate !== undefined ||
      completedDate !== undefined ||
      priority !== undefined ||
      labels !== undefined;

    if (editingContent) {
      const current = await query<{ column_name: string }>(
        `SELECT c.name AS column_name
         FROM tasks t
         JOIN columns c ON c.id = t.column_id
         WHERE t.id = $1`,
        [id],
      );
      const columnName = current.rows[0]?.column_name ?? "";
      if (isDoneName(columnName)) {
        res.status(403).json({ error: "Done tasks cannot be edited." });
        return;
      }
    }

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

    if (dueDate !== undefined) {
      values.push(dueDate);
      updates.push(`due_date = $${values.length}`);
    }

    if (startDate !== undefined) {
      values.push(startDate);
      updates.push(`start_date = $${values.length}`);
    }

    if (completedDate !== undefined) {
      values.push(completedDate);
      updates.push(`completed_date = $${values.length}`);
    }

    if (priority !== undefined) {
      values.push(priority);
      updates.push(`priority = $${values.length}`);
    }

    if (labels !== undefined) {
      values.push(JSON.stringify(labels));
      updates.push(`labels = $${values.length}`);
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

    const moving =
      req.body.columnId !== undefined || req.body.position !== undefined;

    if (updates.length === 0 && !moving) {
      badRequest(res, "nothing to update");
      return;
    }

    updates.push(`updated_at = ${nowSql()}`);
    values.push(id);

    try {
      if (moving) {
        const current = await query<Task>(
          `SELECT ${TASK_FIELDS} FROM tasks WHERE id = $1`,
          [id],
        );
        const task = current.rows[0];
        if (!task) {
          res.status(404).json({ error: "task not found" });
          return;
        }

        const destColumnId =
          req.body.columnId !== undefined ? Number(req.body.columnId) : task.column_id;
        const destColumn = await query<{ id: number; name: string }>(
          "SELECT id, name FROM columns WHERE id = $1",
          [destColumnId],
        );
        if (destColumn.rows.length === 0) {
          badRequest(res, "column does not exist");
          return;
        }

        const siblings = await query<Task>(
          `SELECT ${TASK_FIELDS}
           FROM tasks
           WHERE column_id = $1 AND id <> $2
           ORDER BY position ASC, id ASC`,
          [destColumnId, id],
        );
        let insertAt = siblings.rows.length;
        if (req.body.position !== undefined) {
          const requested = Number(req.body.position);
          if (!Number.isInteger(requested) || requested < 0) {
            badRequest(res, "position must be a non-negative integer");
            return;
          }
          insertAt = Math.min(requested, siblings.rows.length);
        }
        const ordered = [...siblings.rows];
        ordered.splice(insertAt, 0, { ...task, column_id: destColumnId });

        for (const [index, item] of ordered.entries()) {
          await query(
            `UPDATE tasks SET column_id = $1, position = $2, updated_at = ${nowSql()} WHERE id = $3`,
            [destColumnId, index, item.id],
          );
        }

        if (task.column_id !== destColumnId) {
          const leftover = await query<Task>(
            `SELECT id FROM tasks WHERE column_id = $1 ORDER BY position ASC, id ASC`,
            [task.column_id],
          );
          for (const [index, item] of leftover.rows.entries()) {
            await query(`UPDATE tasks SET position = $1, updated_at = ${nowSql()} WHERE id = $2`, [
              index,
              item.id,
            ]);
          }

          const destName = destColumn.rows[0]?.name ?? "";
          const nextDates = applyColumnMoveDates(task, destName);
          const dateUpdates: string[] = [];
          const dateValues: SqlValue[] = [];
          if (nextDates.start_date !== task.start_date) {
            dateValues.push(nextDates.start_date);
            dateUpdates.push(`start_date = $${dateValues.length}`);
          }
          if (nextDates.completed_date !== task.completed_date) {
            dateValues.push(nextDates.completed_date);
            dateUpdates.push(`completed_date = $${dateValues.length}`);
          }
          if (dateUpdates.length > 0) {
            dateValues.push(id);
            await query(
              `UPDATE tasks SET ${dateUpdates.join(", ")}, updated_at = ${nowSql()} WHERE id = $${dateValues.length}`,
              dateValues,
            );
          }
        }

        const result = await query<Task>(
          `SELECT ${TASK_FIELDS} FROM tasks WHERE id = $1`,
          [id],
        );
        res.json(result.rows[0]);
        return;
      }

      const result = await query<Task>(
        `UPDATE tasks
         SET ${updates.join(", ")}
         WHERE id = $${values.length}
         RETURNING ${TASK_FIELDS}`,
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

// POST /api/tasks/:id/duplicate
router.post("/tasks/:id/duplicate", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    badRequest(res, "invalid task id");
    return;
  }

  try {
    const task = await duplicateTask(id);
    res.status(201).json(task);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not duplicate the task.";
    if (message === "Task not found.") {
      res.status(404).json({ error: message });
      return;
    }
    console.error("POST /api/tasks/:id/duplicate failed:", err);
    res.status(500).json({ error: "Could not duplicate the task." });
  }
});

// DELETE /api/tasks/:id
router.delete("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    badRequest(res, "invalid task id");
    return;
  }

  try {
    const result = await query<{ id: number }>("DELETE FROM tasks WHERE id = $1 RETURNING id", [id]);
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
