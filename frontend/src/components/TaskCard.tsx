"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@tmb/shared";
import { taskDragId } from "@/lib/dnd";

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
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`rounded-xl border border-stone-200 bg-white p-3 shadow-sm ${
        isDragging ? "z-10 opacity-60 ring-2 ring-teal-700/30" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none text-stone-300 hover:text-stone-500 active:cursor-grabbing"
          aria-label={`Drag ${task.title}`}
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <h3 className="flex-1 text-sm font-semibold text-stone-900">{task.title}</h3>
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
        <p className="mt-1 pl-6 text-xs leading-5 text-stone-500">{task.description}</p>
      ) : null}
    </article>
  );
}
