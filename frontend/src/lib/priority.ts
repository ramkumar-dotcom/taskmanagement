import type { Task, TaskPriority } from "@tmb/shared";

export type TaskSort = "board" | "priority-desc" | "priority-asc";

export const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const RANK: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function priorityBadgeClass(priority: TaskPriority): string {
  if (priority === "high") {
    return "border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300";
  }
  if (priority === "low") {
    return "border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300";
  }
  return "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300";
}

export function priorityBarClass(priority: TaskPriority): string {
  if (priority === "high") return "bg-rose-500";
  if (priority === "low") return "bg-sky-400";
  return "bg-amber-400";
}

export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  if (sort === "board") return tasks;
  const highFirst = sort === "priority-desc";
  return [...tasks].sort((a, b) => {
    const diff = highFirst ? RANK[b.priority] - RANK[a.priority] : RANK[a.priority] - RANK[b.priority];
    if (diff !== 0) return diff;
    return a.position - b.position;
  });
}
