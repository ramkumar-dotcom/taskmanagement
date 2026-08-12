"use client";

import type { TaskLabel } from "@tmb/shared";
import { LABEL_OPTIONS, labelChipClass, toggleLabel } from "@/lib/labels";

interface LabelFieldProps {
  value: TaskLabel[];
  onChange: (value: TaskLabel[]) => void;
}

export default function LabelField({ value, onChange }: LabelFieldProps) {
  return (
    <fieldset className="space-y-1">
      <legend className="text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
        Labels
      </legend>
      <div className="flex flex-wrap gap-1">
        {LABEL_OPTIONS.map((option) => {
          const selected = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(toggleLabel(value, option.value))}
              onPointerDown={(event) => event.stopPropagation()}
              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${
                selected
                  ? labelChipClass(option.value)
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
