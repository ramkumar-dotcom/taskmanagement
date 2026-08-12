"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, type FormEvent } from "react";
import type { Task, TaskPriority } from "@tmb/shared";
import { columnDateKind, columnDateLabel, isDoneColumnName } from "@/lib/columns";
import { formatDate, isPastDate } from "@/lib/dates";
import { taskDragId } from "@/lib/dnd";
import { priorityBadgeClass, priorityBarClass } from "@/lib/priority";
import DateField from "./DateField";
import PriorityField from "./PriorityField";

type TaskEditFields = {
  title: string;
  description: string;
  dueDate?: string | null;
  startDate?: string | null;
  completedDate?: string | null;
  priority?: TaskPriority;
};

interface TaskCardFaceProps {
  task: Task;
  columnName?: string;
  onDelete?: (taskId: number) => Promise<void>;
  onEdit?: (taskId: number, fields: TaskEditFields) => Promise<void>;
  overlay?: boolean;
}

export function TaskCardFace({
  task,
  columnName,
  onDelete,
  onEdit,
  overlay = false,
}: TaskCardFaceProps) {
  const canEdit = Boolean(onEdit) && !isDoneColumnName(columnName ?? "");
  const dateKind = columnDateKind(columnName ?? "");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [date, setDate] = useState(
    (dateKind === "due" ? task.due_date : dateKind === "start" ? task.start_date : task.completed_date) ??
      "",
  );
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function resetForm(): void {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setDate(
      (dateKind === "due" ? task.due_date : dateKind === "start" ? task.start_date : task.completed_date) ??
        "",
    );
    setPriority(task.priority);
    setError("");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    const nextTitle = title.trim();
    if (!nextTitle || !onEdit) return;
    setBusy(true);
    setError("");
    try {
      const fields: TaskEditFields = {
        title: nextTitle,
        description: description.trim(),
      };
      if (dateKind === "due") fields.dueDate = date || null;
      if (dateKind === "start") fields.startDate = date || null;
      if (dateKind === "completed") fields.completedDate = date || null;
      fields.priority = priority;
      await onEdit(task.id, fields);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  if (editing && canEdit) {
    return (
      <article className="rounded-xl border border-teal-700/30 bg-white p-3 shadow-sm dark:border-teal-500/30 dark:bg-stone-900">
        <form
          onSubmit={(event) => void handleSave(event)}
          onPointerDown={(event) => event.stopPropagation()}
          className="space-y-2"
        >
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm font-semibold text-stone-900 outline-none focus:border-teal-700 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-50"
            autoFocus
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="Description (optional)"
            className="w-full resize-none rounded-md border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-700 outline-none focus:border-teal-700 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-200"
          />
          <DateField label={columnDateLabel(dateKind)} value={date} onChange={setDate} />
          <PriorityField value={priority} onChange={setPriority} />
          {error ? <p className="text-xs text-red-700 dark:text-red-400">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || !title.trim()}
              className="rounded-md bg-teal-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-teal-900 disabled:bg-stone-300 dark:disabled:bg-stone-700"
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                resetForm();
              }}
              className="rounded-md px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article
      className={`relative overflow-hidden rounded-xl border bg-white p-3 dark:bg-stone-900 ${
        overlay
          ? "border-teal-700/30 shadow-xl shadow-stone-900/20 ring-1 ring-teal-800/10 dark:border-teal-500/30"
          : "border-stone-200 shadow-sm dark:border-stone-700"
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${priorityBarClass(task.priority)}`} aria-hidden />
      <div className="flex items-start justify-between gap-2 pl-1.5">
        <h3 className="flex-1 text-sm font-semibold text-stone-900 dark:text-stone-50">{task.title}</h3>
        <div className="flex items-center gap-0.5">
          {canEdit ? (
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setEditing(true)}
              className="rounded px-1.5 text-xs text-stone-400 transition hover:bg-stone-100 hover:text-teal-800 dark:hover:bg-stone-800 dark:hover:text-teal-300"
              aria-label={`Edit ${task.title}`}
            >
              Edit
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => {
                void onDelete(task.id);
              }}
              className="rounded px-1.5 text-xs text-stone-400 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950 dark:hover:text-red-400"
              aria-label={`Delete ${task.title}`}
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>
      <span
        className={`mt-2 ml-1.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityBadgeClass(task.priority)}`}
      >
        {task.priority}
      </span>
      {task.description ? (
        <p className="mt-1 pl-1.5 text-xs leading-5 text-stone-500 dark:text-stone-400">{task.description}</p>
      ) : null}
      <div className="pl-1.5">
        <TaskDates task={task} />
      </div>
    </article>
  );
}

function TaskDates({ task }: { task: Task }) {
  const items = [
    task.due_date
      ? {
          key: "due",
          label: "Due",
          value: task.due_date,
          className: isPastDate(task.due_date) && !task.completed_date ? "text-amber-800 dark:text-amber-300" : "text-stone-500 dark:text-stone-400",
        }
      : null,
    task.start_date ? { key: "start", label: "Started", value: task.start_date, className: "text-stone-500 dark:text-stone-400" } : null,
    task.completed_date
      ? { key: "done", label: "Completed", value: task.completed_date, className: "text-teal-800 dark:text-teal-300" }
      : null,
  ].filter((item): item is { key: string; label: string; value: string; className: string } => item !== null);

  if (items.length === 0) return null;

  return (
    <ul className="mt-2 space-y-0.5">
      {items.map((item) => (
        <li key={item.key} className={`text-[11px] ${item.className}`}>
          {item.label} {formatDate(item.value)}
        </li>
      ))}
    </ul>
  );
}

interface TaskCardProps {
  task: Task;
  columnName: string;
  onDelete: (taskId: number) => Promise<void>;
  onEdit: (taskId: number, fields: TaskEditFields) => Promise<void>;
}

export default function TaskCard({ task, columnName, onDelete, onEdit }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: taskDragId(task.id),
    data: { type: "task", task },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)",
      }}
      className={`touch-none ${isDragging ? "z-10 opacity-30" : ""}`}
    >
      <div className="cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <TaskCardFace task={task} columnName={columnName} onDelete={onDelete} onEdit={onEdit} />
      </div>
    </div>
  );
}
