"use client";

import type { TaskPriority } from "@tmb/shared";
import { PRIORITIES, priorityBadgeClass } from "@/lib/priority";

interface PriorityFieldProps {
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
  disabled?: boolean;
}

export default function PriorityField({ value, onChange, disabled = false }: PriorityFieldProps) {
  return (
    <fieldset className="space-y-1" disabled={disabled}>
      <legend className="text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
        Priority
      </legend>
      <div className="flex gap-1">
        {PRIORITIES.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              onPointerDown={(event) => event.stopPropagation()}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                selected
                  ? priorityBadgeClass(option.value)
                  : "border-stone-300 bg-white text-stone-500 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-400 dark:hover:bg-stone-800"
              }`}
              aria-pressed={selected}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
