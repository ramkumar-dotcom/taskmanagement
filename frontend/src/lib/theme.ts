export type Theme = "light" | "dark";

const KEY = "tmb_theme";

export function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

export function readTheme(): Theme {
  const stored = readStoredTheme();
  if (stored) return stored;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function saveTheme(theme: Theme): void {
  window.localStorage.setItem(KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new Event("tmb-theme"));
}

export function toggleTheme(): Theme {
  const next: Theme = readTheme() === "dark" ? "light" : "dark";
  saveTheme(next);
  return next;
}
