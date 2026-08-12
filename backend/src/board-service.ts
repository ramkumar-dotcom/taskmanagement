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
