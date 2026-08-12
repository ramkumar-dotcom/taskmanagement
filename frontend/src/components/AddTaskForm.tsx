"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { CreateTaskRequest, TaskLabel, TaskPriority } from "@tmb/shared";
import { columnDateKind, columnDateLabel } from "@/lib/columns";
import { errorMessage } from "@/lib/parse";
import DateField from "./DateField";
import LabelField from "./LabelField";
import PriorityField from "./PriorityField";

interface AddTaskFormProps {
  columns: { id: number; name: string }[];
  onCreated: (input: CreateTaskRequest) => Promise<void>;
}

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-500";

export default function AddTaskForm({ columns, onCreated }: AddTaskFormProps) {
  const firstColumn = columns[0];
  const [columnId, setColumnId] = useState(firstColumn?.id ?? 0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [labels, setLabels] = useState<TaskLabel[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (columns.length === 0) {
      setColumnId(0);
      return;
    }
    if (!columns.some((column) => column.id === columnId)) {
      setColumnId(columns[0]?.id ?? 0);
    }
  }, [columns, columnId]);

  const selectedColumn = columns.find((column) => column.id === columnId) ?? firstColumn;
  const dateKind = columnDateKind(selectedColumn?.name ?? "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !columnId || busy) return;

    setBusy(true);
    setError("");
    try {
      const payload: CreateTaskRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        columnId,
        priority,
        labels,
      };
      if (date) {
        if (dateKind === "due") payload.dueDate = date;
        if (dateKind === "start") payload.startDate = date;
        if (dateKind === "completed") payload.completedDate = date;
      }
      await onCreated(payload);
      setTitle("");
      setDescription("");
      setDate("");
      setPriority("medium");
      setLabels([]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (columns.length === 0) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
        New task
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem_11rem]">
        <label className="text-sm">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Title
          </span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs to be done?"
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Column
          </span>
          <select
            value={columnId}
            onChange={(event) => setColumnId(Number(event.target.value))}
            className={inputClass}
          >
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
          </select>
        </label>
        <DateField label={columnDateLabel(dateKind)} value={date} onChange={setDate} />
      </div>
      <div className="mt-3">
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          placeholder="Description (optional)"
          className={`${inputClass} resize-none text-xs text-stone-700 dark:text-stone-200`}
        />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <PriorityField value={priority} onChange={setPriority} />
        <LabelField value={labels} onChange={setLabels} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300 dark:disabled:bg-stone-700"
        >
          {busy ? "Saving…" : "Add task"}
        </button>
        {error ? <p className="text-xs text-red-700 dark:text-red-400">{error}</p> : null}
      </div>
    </form>
  );
}
