"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { ColumnWithTasks, CreateTaskRequest } from "@tmb/shared";
import { columnDragId, taskDragId } from "@/lib/dnd";
import AddTaskForm from "./AddTaskForm";
import TaskCard from "./TaskCard";

const ACCENTS = [
  "border-t-stone-400",
  "border-t-amber-400",
  "border-t-teal-600",
] as const;

interface ColumnProps {
  column: ColumnWithTasks;
  index: number;
  onCreate: (input: CreateTaskRequest) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
  onEdit: (
    taskId: number,
    fields: {
      title: string;
      description: string;
      dueDate?: string | null;
      startDate?: string | null;
      completedDate?: string | null;
    },
  ) => Promise<void>;
}

export default function Column({ column, index, onCreate, onDelete, onEdit }: ColumnProps) {
  const accent = ACCENTS[index % ACCENTS.length];
  const { setNodeRef, isOver } = useDroppable({
    id: columnDragId(column.id),
    data: { type: "column", columnId: column.id },
  });

  return (
    <section
      className={`flex min-h-[28rem] flex-col rounded-2xl border border-stone-200 border-t-4 bg-stone-100/80 p-4 ${accent} ${
        isOver ? "ring-2 ring-teal-700/20" : ""
      }`}
    >
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-stone-800">
          {column.name}
        </h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-stone-500">
          {column.tasks.length}
        </span>
      </header>

      <div ref={setNodeRef} className="flex flex-1 flex-col gap-3">
        <SortableContext
          items={column.tasks.map((task) => taskDragId(task.id))}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columnName={column.name}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </SortableContext>
        {column.tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 px-3 py-8 text-center text-xs text-stone-400">
            Drop a card here
          </p>
        ) : null}
      </div>

      <AddTaskForm columnId={column.id} columnName={column.name} onCreated={onCreate} />
    </section>
  );
}
