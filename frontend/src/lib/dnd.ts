import {
  closestCorners,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from "@dnd-kit/core";
import type { BoardWithColumns, Task } from "@tmb/shared";
import { applyColumnMoveDates } from "./dates";

export const boardCollision: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args);
  const overTask = hits.find((hit) => String(hit.id).startsWith("task-"));
  if (overTask) return [overTask];
  const overColumn = hits.find((hit) => String(hit.id).startsWith("column-"));
  if (overColumn) return [overColumn];
  return closestCorners(args);
};

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

export function moveTask(
  board: BoardWithColumns,
  taskId: number,
  columnId: number,
  position: number,
): BoardWithColumns {
  const task = findTask(board, taskId);
  if (!task) return board;

  const columns = board.columns.map((column) => ({
    ...column,
    tasks: column.tasks.filter((item) => item.id !== taskId),
  }));
  const dest = columns.find((column) => column.id === columnId);
  if (!dest) return board;

  const nextTasks = [...dest.tasks];
  const insertAt = Math.max(0, Math.min(position, nextTasks.length));
  const dates =
    task.column_id === columnId ? {} : applyColumnMoveDates(task, dest.name);
  nextTasks.splice(insertAt, 0, {
    ...task,
    ...dates,
    column_id: columnId,
    position: insertAt,
  });
  dest.tasks = nextTasks.map((item, index) => ({ ...item, position: index }));
  return { ...board, columns };
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
    const currentIndex = column.tasks.findIndex((item) => item.id === draggedId);
    // Same column container — do not jump the card to the end.
    if (currentIndex >= 0) {
      return { columnId: column.id, position: currentIndex };
    }
    const withoutDragged = column.tasks.filter((item) => item.id !== draggedId);
    return { columnId: column.id, position: withoutDragged.length };
  }

  return null;
}
