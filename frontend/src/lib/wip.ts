const KEY = "tmb_wip_limit";
export const DEFAULT_WIP_LIMIT = 3;
const MIN_WIP_LIMIT = 1;
const MAX_WIP_LIMIT = 20;

export function clampWipLimit(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_WIP_LIMIT;
  return Math.min(MAX_WIP_LIMIT, Math.max(MIN_WIP_LIMIT, Math.round(value)));
}

export function readWipLimit(): number {
  if (typeof window === "undefined") return DEFAULT_WIP_LIMIT;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return DEFAULT_WIP_LIMIT;
  return clampWipLimit(Number(raw));
}

export function saveWipLimit(limit: number): number {
  const next = clampWipLimit(limit);
  window.localStorage.setItem(KEY, String(next));
  return next;
}
