"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, type FormEvent } from "react";
import type { Task } from "@tmb/shared";
import { columnDateKind, columnDateLabel, isDoneColumnName } from "@/lib/columns";
import { formatDate, isPastDate } from "@/lib/dates";
import { taskDragId } from "@/lib/dnd";
import DateField from "./DateField";

type TaskEditFields = {
  title: string;
  description: string;
  dueDate?: string | null;
  startDate?: string | null;
  completedDate?: string | null;
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function resetForm(): void {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setDate(
      (dateKind === "due" ? task.due_date : dateKind === "start" ? task.start_date : task.completed_date) ??
        "",
    );
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
      <article className="rounded-xl border border-teal-700/30 bg-white p-3 shadow-sm">
        <form
          onSubmit={(event) => void handleSave(event)}
          onPointerDown={(event) => event.stopPropagation()}
          className="space-y-2"
        >
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-md border border-stone-300 px-2 py-1.5 text-sm font-semibold text-stone-900 outline-none focus:border-teal-700"
            autoFocus
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="Description (optional)"
            className="w-full resize-none rounded-md border border-stone-300 px-2 py-1.5 text-xs text-stone-700 outline-none focus:border-teal-700"
          />
          <DateField label={columnDateLabel(dateKind)} value={date} onChange={setDate} />
          {error ? <p className="text-xs text-red-700">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || !title.trim()}
              className="rounded-md bg-teal-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-teal-900 disabled:bg-stone-300"
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                resetForm();
              }}
              className="rounded-md px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-100"
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
      className={`rounded-xl border bg-white p-3 ${
        overlay
          ? "border-teal-700/30 shadow-xl shadow-stone-900/10 ring-1 ring-teal-800/10"
          : "border-stone-200 shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex-1 text-sm font-semibold text-stone-900">{task.title}</h3>
        <div className="flex items-center gap-0.5">
          {canEdit ? (
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setEditing(true)}
              className="rounded px-1.5 text-xs text-stone-400 transition hover:bg-stone-100 hover:text-teal-800"
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
              className="rounded px-1.5 text-xs text-stone-400 transition hover:bg-red-50 hover:text-red-700"
              aria-label={`Delete ${task.title}`}
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>
      {task.description ? (
        <p className="mt-1 text-xs leading-5 text-stone-500">{task.description}</p>
      ) : null}
      <TaskDates task={task} />
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
          className: isPastDate(task.due_date) && !task.completed_date ? "text-amber-800" : "text-stone-500",
        }
      : null,
    task.start_date ? { key: "start", label: "Started", value: task.start_date, className: "text-stone-500" } : null,
    task.completed_date
      ? { key: "done", label: "Completed", value: task.completed_date, className: "text-teal-800" }
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
