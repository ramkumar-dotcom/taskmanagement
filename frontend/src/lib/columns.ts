export function isDoneColumnName(name: string): boolean {
  return name.trim().toLowerCase() === "done";
}

export function isInProgressColumnName(name: string): boolean {
  return name.trim().toLowerCase() === "in progress";
}

export type ColumnDateKind = "due" | "start" | "completed";

export function columnDateKind(name: string): ColumnDateKind {
  if (isDoneColumnName(name)) return "completed";
  if (isInProgressColumnName(name)) return "start";
  return "due";
}

export function columnDateLabel(kind: ColumnDateKind): string {
  if (kind === "due") return "Due date";
  if (kind === "start") return "Start date";
  return "Completed date";
}
