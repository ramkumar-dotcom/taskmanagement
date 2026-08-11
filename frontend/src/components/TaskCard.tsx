"use client";

import type { Column, Task } from "@tmb/shared";

interface TaskCardProps {
  task: Task;
  columns: Column[];
  onMove: (taskId: number, columnId: number) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
}

export default function TaskCard({ task, columns, onMove, onDelete }: TaskCardProps) {
  return (
    <article className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-stone-900">{task.title}</h3>
        <button
          type="button"
          onClick={() => {
            void onDelete(task.id);
          }}
          className="rounded px-1.5 text-xs text-stone-400 transition hover:bg-red-50 hover:text-red-700"
          aria-label={`Delete ${task.title}`}
        >
          ✕
        </button>
      </div>

      {task.description ? (
        <p className="mt-1 text-xs leading-5 text-stone-500">{task.description}</p>
      ) : null}

      <label className="mt-3 block text-[11px] font-medium uppercase tracking-wide text-stone-400">
        Move to
        <select
          className="mt-1 w-full rounded-md border border-stone-200 bg-stone-50 px-2 py-1.5 text-xs text-stone-700 outline-none focus:border-teal-600"
          value={task.column_id}
          onChange={(event) => {
            void onMove(task.id, Number(event.target.value));
          }}
        >
          {columns.map((column) => (
            <option key={column.id} value={column.id}>
              {column.name}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}
