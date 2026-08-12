import type { BoardWithColumns, Task } from "@tmb/shared";

export function taskDragId(taskId: number): string {
  return `task-${taskId}`;
}

export function columnDragId(columnId: number): string {
  return `column-${columnId}`;
}

export function parseTaskDragId(id: string): number | null {
  const match = /^task-(\d+)$/.exec(id);
  return match ? Number(match[1]) : null;
}

export function parseColumnDragId(id: string): number | null {
  const match = /^column-(\d+)$/.exec(id);
  return match ? Number(match[1]) : null;
}

export function findTask(board: BoardWithColumns, taskId: number): Task | undefined {
  for (const column of board.columns) {
    const task = column.tasks.find((item) => item.id === taskId);
    if (task) return task;
  }
  return undefined;
}

export function dropIndex(
  board: BoardWithColumns,
  draggedId: number,
  overId: string,
): { columnId: number; position: number } | null {
  const overTaskId = parseTaskDragId(overId);
  if (overTaskId !== null) {
    const overTask = findTask(board, overTaskId);
    if (!overTask) return null;
    const column = board.columns.find((item) => item.id === overTask.column_id);
    if (!column) return null;
    const withoutDragged = column.tasks.filter((item) => item.id !== draggedId);
    const position = withoutDragged.findIndex((item) => item.id === overTaskId);
    return {
      columnId: column.id,
      position: position === -1 ? withoutDragged.length : position,
    };
  }

  const overColumnId = parseColumnDragId(overId);
  if (overColumnId !== null) {
    const column = board.columns.find((item) => item.id === overColumnId);
    if (!column) return null;
    const withoutDragged = column.tasks.filter((item) => item.id !== draggedId);
    return { columnId: column.id, position: withoutDragged.length };
  }

  return null;
}
