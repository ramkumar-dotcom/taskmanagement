import type { Task } from "@tmb/shared";
import { columnDateKind, type ColumnDateKind } from "./columns";

export type DateFilterField = "column" | "due" | "start" | "completed" | "any";

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isPastDate(value: string | null | undefined): boolean {
  if (!value) return false;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return false;
  const due = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

export function normalizeDateRange(from: string, to: string): { from: string; to: string } {
  if (from && to && from > to) return { from: to, to: from };
  return { from, to };
}

export function dateInRange(value: string | null | undefined, from: string, to: string): boolean {
  if (!value) return false;
  const day = value.slice(0, 10);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

function dateForKind(task: Task, kind: ColumnDateKind): string | null {
  if (kind === "due") return task.due_date;
  if (kind === "start") return task.start_date;
  return task.completed_date;
}

export function taskMatchesDateFilter(
  task: Task,
  columnName: string,
  from: string,
  to: string,
  field: DateFilterField = "column",
): boolean {
  if (!from && !to) return true;
  const range = normalizeDateRange(from, to);
  if (field === "any") {
    return (
      dateInRange(task.due_date, range.from, range.to) ||
      dateInRange(task.start_date, range.from, range.to) ||
      dateInRange(task.completed_date, range.from, range.to)
    );
  }
  const kind: ColumnDateKind =
    field === "column" ? columnDateKind(columnName) : field === "due" ? "due" : field === "start" ? "start" : "completed";
  return dateInRange(dateForKind(task, kind), range.from, range.to);
}
