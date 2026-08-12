import type { Task } from "@tmb/shared";
import { isDoneColumnName, isInProgressColumnName } from "./columns";
import { isPastDate } from "./dates";

export type BoardView = "all" | "overdue" | "late" | "in-progress";

export const BOARD_VIEWS: { value: BoardView; label: string; empty: string }[] = [
  { value: "all", label: "All", empty: "No tasks" },
  { value: "overdue", label: "Overdue", empty: "No overdue tasks" },
  { value: "late", label: "Late", empty: "No late tasks" },
  { value: "in-progress", label: "In Progress", empty: "No tasks in progress" },
];

export function taskMatchesView(task: Task, columnName: string, view: BoardView): boolean {
  if (view === "all") return true;
  if (view === "in-progress") return isInProgressColumnName(columnName);
  if (view === "overdue") {
    return (
      !isDoneColumnName(columnName) &&
      !isInProgressColumnName(columnName) &&
      !task.completed_date &&
      isPastDate(task.due_date)
    );
  }
  return isInProgressColumnName(columnName) && isPastDate(task.due_date);
}
