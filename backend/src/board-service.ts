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
            t.due_date, t.start_date, t.completed_date, t.priority
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
