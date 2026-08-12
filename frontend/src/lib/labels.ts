import type { Task, TaskLabel } from "@tmb/shared";

export const LABEL_OPTIONS: { value: TaskLabel; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "design", label: "Design" },
  { value: "docs", label: "Docs" },
  { value: "chore", label: "Chore" },
];

export function labelChipClass(label: TaskLabel): string {
  if (label === "bug") {
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300";
  }
  if (label === "feature") {
    return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300";
  }
  if (label === "design") {
    return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800 dark:border-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-300";
  }
  if (label === "docs") {
    return "border-stone-300 bg-stone-100 text-stone-700 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300";
  }
  return "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-300";
}

export function toggleLabel(current: TaskLabel[], next: TaskLabel): TaskLabel[] {
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function taskMatchesSearch(task: Task, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (task.title.toLowerCase().includes(needle)) return true;
  if ((task.description ?? "").toLowerCase().includes(needle)) return true;
  return task.labels.some((label) => label.includes(needle));
}
