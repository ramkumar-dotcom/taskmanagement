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
