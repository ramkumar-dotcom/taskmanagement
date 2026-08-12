"use client";

import type { DateFilterField } from "@/lib/dates";

interface DateRangeFilterProps {
  from: string;
  to: string;
  field: DateFilterField;
  matchCount: number;
  totalCount: number;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onFieldChange: (value: DateFilterField) => void;
  onClear: () => void;
}

const FIELD_OPTIONS: { value: DateFilterField; label: string }[] = [
  { value: "column", label: "Column date" },
  { value: "due", label: "Due date" },
  { value: "start", label: "Start date" },
  { value: "completed", label: "Completed date" },
  { value: "any", label: "Any date" },
];

export default function DateRangeFilter({
  from,
  to,
  field,
  matchCount,
  totalCount,
  onFromChange,
  onToChange,
  onFieldChange,
  onClear,
}: DateRangeFilterProps) {
  const active = Boolean(from || to);
  const reversed = Boolean(from && to && from > to);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400">
          Filter by
        </span>
        <select
          value={field}
          onChange={(event) => onFieldChange(event.target.value as DateFilterField)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-teal-700"
        >
          {FIELD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400">
          From
        </span>
        <input
          type="date"
          value={from}
          onChange={(event) => onFromChange(event.target.value)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-teal-700"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400">
          To
        </span>
        <input
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => onToChange(event.target.value)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-teal-700"
        />
      </label>
      {active ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
        >
          Clear dates
        </button>
      ) : null}
      {active ? (
        <p className="pb-2 text-xs text-stone-500">
          Showing {matchCount} of {totalCount} {totalCount === 1 ? "task" : "tasks"}
          {reversed ? " · From is after To, so the range was swapped" : ""}
        </p>
      ) : null}
    </div>
  );
}
