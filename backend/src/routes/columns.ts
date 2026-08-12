import { Router } from "express";
import { createColumn, updateColumn } from "../board-service";
import { ensureDatabase } from "../db";

const router = Router();

function asTrimmedName(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

router.post("/columns", async (req, res) => {
  const name = asTrimmedName(req.body?.name);
  const boardId = Number(req.body?.boardId);
  if (!name) {
    res.status(400).json({ error: "Column name is required." });
    return;
  }
  if (name.length > 80) {
    res.status(400).json({ error: "Column name must be 80 characters or less." });
    return;
  }
  if (!Number.isInteger(boardId) || boardId <= 0) {
    res.status(400).json({ error: "boardId must be a number." });
    return;
  }

  try {
    try {
      await ensureDatabase();
    } catch {
      // tables may already exist
    }
    const column = await createColumn(boardId, name);
    res.status(201).json(column);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create the column.";
    if (message === "Board not found.") {
      res.status(404).json({ error: message });
      return;
    }
    console.error("POST /api/columns failed:", err);
    res.status(500).json({ error: "Could not create the column." });
  }
});

router.patch("/columns/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "invalid column id" });
    return;
  }

  const fields: { name?: string; position?: number } = {};
  if (req.body?.name !== undefined) {
    const name = asTrimmedName(req.body.name);
    if (!name) {
      res.status(400).json({ error: "Column name cannot be empty." });
      return;
    }
    if (name.length > 80) {
      res.status(400).json({ error: "Column name must be 80 characters or less." });
      return;
    }
    fields.name = name;
  }
  if (req.body?.position !== undefined) {
    const position = Number(req.body.position);
    if (!Number.isInteger(position) || position < 0) {
      res.status(400).json({ error: "position must be a non-negative integer" });
      return;
    }
    fields.position = position;
  }
  if (fields.name === undefined && fields.position === undefined) {
    res.status(400).json({ error: "nothing to update" });
    return;
  }

  try {
    const column = await updateColumn(id, fields);
    res.json(column);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update the column.";
    if (message === "Column not found.") {
      res.status(404).json({ error: message });
      return;
    }
    console.error("PATCH /api/columns/:id failed:", err);
    res.status(500).json({ error: "Could not update the column." });
  }
});

export default router;
