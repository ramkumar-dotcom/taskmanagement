"use client";

import { useEffect } from "react";
import { applyTheme, readStoredTheme, readTheme, toggleTheme } from "@/lib/theme";

export default function ThemeToggle() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function onSystemChange() {
      if (!readStoredTheme()) {
        applyTheme(readTheme());
      }
    }
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      className="rounded-lg border border-stone-300 p-2 text-stone-700 hover:bg-white dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
      aria-label="Toggle color theme"
      title="Toggle color theme"
    >
      <MoonIcon />
      <SunIcon />
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="hidden h-4 w-4 dark:block" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.2 6.2 4.8 4.8M19.2 19.2l-1.4-1.4M6.2 17.8 4.8 19.2M19.2 4.8l-1.4 1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 dark:hidden" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
    </svg>
  );
}
