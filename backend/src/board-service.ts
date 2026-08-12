import type { Board, BoardWithColumns, Column, Task } from "@tmb/shared";
import { query } from "./db";

const DEFAULT_COLUMNS = ["To Do", "In Progress", "Done"] as const;

export async function loadBoardById(boardId: number): Promise<BoardWithColumns | null> {
  const boardResult = await query<Board>(
    "SELECT id, name, created_at FROM boards WHERE id = $1",
    [boardId],
  );
  const board = boardResult.rows[0];
  if (!board) return null;

  const columnsResult = await query<Column>(
    `SELECT id, board_id, name, position
     FROM columns
     WHERE board_id = $1
     ORDER BY position ASC`,
    [board.id],
  );

  const tasksResult = await query<Task>(
    `SELECT t.id, t.column_id, t.title, t.description, t.position, t.created_at,
            t.due_date, t.start_date, t.completed_date, t.priority, t.labels
     FROM tasks t
     JOIN columns c ON c.id = t.column_id
     WHERE c.board_id = $1
     ORDER BY t.position ASC, t.id ASC`,
    [board.id],
  );

  return {
    ...board,
    columns: columnsResult.rows.map((column) => ({
      ...column,
      tasks: tasksResult.rows.filter((task) => task.column_id === column.id),
    })),
  };
}

export async function createBoardWithColumns(
  name: string,
  userId: number,
): Promise<BoardWithColumns> {
  const created = await query<Board>(
    `INSERT INTO boards (name, user_id)
     VALUES ($1, $2)
     RETURNING id, name, created_at`,
    [name, userId],
  );
  const board = created.rows[0];
  if (!board) {
    throw new Error("Could not create the board.");
  }

  for (const [index, columnName] of DEFAULT_COLUMNS.entries()) {
    await query(
      `INSERT INTO columns (board_id, name, position) VALUES ($1, $2, $3)`,
      [board.id, columnName, index],
    );
  }

  const loaded = await loadBoardById(board.id);
  if (!loaded) {
    throw new Error("Could not load the new board.");
  }
  return loaded;
}

export async function createColumn(boardId: number, name: string): Promise<Column> {
  const board = await query<{ id: number }>("SELECT id FROM boards WHERE id = $1", [boardId]);
  if (!board.rows[0]) {
    throw new Error("Board not found.");
  }
  const positionResult = await query<{ next_position: number | string }>(
    "SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM columns WHERE board_id = $1",
    [boardId],
  );
  const nextPosition = Number(positionResult.rows[0]?.next_position ?? 0);
  const created = await query<Column>(
    `INSERT INTO columns (board_id, name, position)
     VALUES ($1, $2, $3)
     RETURNING id, board_id, name, position`,
    [boardId, name, nextPosition],
  );
  const column = created.rows[0];
  if (!column) {
    throw new Error("Could not create the column.");
  }
  return column;
}

export async function updateColumn(
  columnId: number,
  fields: { name?: string; position?: number },
): Promise<Column> {
  const current = await query<Column>(
    "SELECT id, board_id, name, position FROM columns WHERE id = $1",
    [columnId],
  );
  const column = current.rows[0];
  if (!column) {
    throw new Error("Column not found.");
  }

  if (fields.name !== undefined && fields.name !== column.name) {
    await query("UPDATE columns SET name = $1 WHERE id = $2", [fields.name, columnId]);
    column.name = fields.name;
  }

  if (fields.position !== undefined && fields.position !== column.position) {
    const siblings = await query<Column>(
      `SELECT id, board_id, name, position
       FROM columns
       WHERE board_id = $1
       ORDER BY position ASC, id ASC`,
      [column.board_id],
    );
    const without = siblings.rows.filter((item) => item.id !== columnId);
    const insertAt = Math.max(0, Math.min(fields.position, without.length));
    without.splice(insertAt, 0, { ...column, name: fields.name ?? column.name });
    for (const [index, item] of without.entries()) {
      await query("UPDATE columns SET position = $1 WHERE id = $2", [index, item.id]);
    }
    column.position = insertAt;
  }

  return column;
}

function copyTitle(title: string, maxLength = 200): string {
  const suffix = " (copy)";
  const next = title.endsWith(suffix) ? `${title} 2` : `${title}${suffix}`;
  return next.slice(0, maxLength);
}

export async function duplicateTask(taskId: number): Promise<Task> {
  const current = await query<Task>(
    `SELECT id, column_id, title, description, position, created_at,
            due_date, start_date, completed_date, priority, labels
     FROM tasks WHERE id = $1`,
    [taskId],
  );
  const task = current.rows[0];
  if (!task) {
    throw new Error("Task not found.");
  }

  const positionResult = await query<{ next_position: number | string }>(
    "SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM tasks WHERE column_id = $1",
    [task.column_id],
  );
  const nextPosition = Number(positionResult.rows[0]?.next_position ?? 0);
  const labelsJson = JSON.stringify(Array.isArray(task.labels) ? task.labels : []);

  const created = await query<Task>(
    `INSERT INTO tasks (column_id, title, description, position, due_date, start_date, completed_date, priority, labels)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, column_id, title, description, position, created_at, due_date, start_date, completed_date, priority, labels`,
    [
      task.column_id,
      copyTitle(task.title),
      task.description,
      nextPosition,
      task.due_date,
      task.start_date,
      task.completed_date,
      task.priority || "medium",
      labelsJson,
    ],
  );
  const copy = created.rows[0];
  if (!copy) {
    throw new Error("Could not duplicate the task.");
  }
  return copy;
}

export async function duplicateBoard(
  sourceId: number,
  userId: number,
  name?: string,
): Promise<BoardWithColumns> {
  const source = await loadBoardById(sourceId);
  if (!source) {
    throw new Error("Board not found.");
  }

  const created = await query<Board>(
    `INSERT INTO boards (name, user_id)
     VALUES ($1, $2)
     RETURNING id, name, created_at`,
    [name?.trim() || copyTitle(source.name, 120), userId],
  );
  const board = created.rows[0];
  if (!board) {
    throw new Error("Could not duplicate the board.");
  }

  for (const column of source.columns) {
    const inserted = await query<Column>(
      `INSERT INTO columns (board_id, name, position)
       VALUES ($1, $2, $3)
       RETURNING id, board_id, name, position`,
      [board.id, column.name, column.position],
    );
    const nextColumn = inserted.rows[0];
    if (!nextColumn) continue;
    for (const task of column.tasks) {
      await query(
        `INSERT INTO tasks (column_id, title, description, position, due_date, start_date, completed_date, priority, labels)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          nextColumn.id,
          task.title,
          task.description,
          task.position,
          task.due_date,
          task.start_date,
          task.completed_date,
          task.priority || "medium",
          JSON.stringify(Array.isArray(task.labels) ? task.labels : []),
        ],
      );
    }
  }

  const loaded = await loadBoardById(board.id);
  if (!loaded) {
    throw new Error("Could not load the duplicated board.");
  }
  return loaded;
}
