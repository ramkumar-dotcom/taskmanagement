"use client";

import type { ColumnWithTasks, CreateTaskRequest } from "@tmb/shared";
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
  columns: ColumnWithTasks[];
  onCreate: (input: CreateTaskRequest) => Promise<void>;
  onMove: (taskId: number, columnId: number) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
}

export default function Column({
  column,
  index,
  columns,
  onCreate,
  onMove,
  onDelete,
}: ColumnProps) {
  const accent = ACCENTS[index % ACCENTS.length];

  return (
    <section
      className={`flex min-h-[28rem] flex-col rounded-2xl border border-stone-200 border-t-4 bg-stone-100/80 p-4 ${accent}`}
    >
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-stone-800">
          {column.name}
        </h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-stone-500">
          {column.tasks.length}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-3">
        {column.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            columns={columns}
            onMove={onMove}
            onDelete={onDelete}
          />
        ))}
      </div>

      <AddTaskForm columnId={column.id} onCreated={onCreate} />
    </section>
  );
}
