"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@tmb/shared";
import { taskDragId } from "@/lib/dnd";

interface TaskCardFaceProps {
  task: Task;
  onDelete?: (taskId: number) => Promise<void>;
  overlay?: boolean;
}

export function TaskCardFace({ task, onDelete, overlay = false }: TaskCardFaceProps) {
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
      {task.description ? (
        <p className="mt-1 text-xs leading-5 text-stone-500">{task.description}</p>
      ) : null}
    </article>
  );
}

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: number) => Promise<void>;
}

export default function TaskCard({ task, onDelete }: TaskCardProps) {
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
        <TaskCardFace task={task} onDelete={onDelete} />
      </div>
    </div>
  );
}
