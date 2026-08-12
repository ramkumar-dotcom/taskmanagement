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
  const [open, setOpen] = useState(false);
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

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) close();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, busy]);

  const selectedColumn = columns.find((column) => column.id === columnId) ?? firstColumn;
  const dateKind = columnDateKind(selectedColumn?.name ?? "");

  function resetForm(): void {
    setTitle("");
    setDescription("");
    setDate("");
    setPriority("medium");
    setLabels([]);
    setError("");
    setColumnId(firstColumn?.id ?? 0);
  }

  function close(): void {
    if (busy) return;
    setOpen(false);
    resetForm();
  }

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
      setOpen(false);
      resetForm();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (columns.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
      >
        Add task
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-900/50 px-4 py-10 backdrop-blur-sm dark:bg-black/60"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-task-title"
            className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-5 shadow-xl dark:border-stone-700 dark:bg-stone-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                  New task
                </p>
                <h2 id="add-task-title" className="mt-1 text-lg font-semibold text-stone-900 dark:text-stone-50">
                  Add a task
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg px-2 py-1 text-sm text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  Title
                </span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="What needs to be done?"
                  className={inputClass}
                  autoFocus
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
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
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Description (optional)"
                className={`${inputClass} resize-none text-xs text-stone-700 dark:text-stone-200`}
              />
              <PriorityField value={priority} onChange={setPriority} />
              <LabelField value={labels} onChange={setLabels} />
              {error ? <p className="text-xs text-red-700 dark:text-red-400">{error}</p> : null}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || !title.trim()}
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300 dark:disabled:bg-stone-700"
                >
                  {busy ? "Saving…" : "Add task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
