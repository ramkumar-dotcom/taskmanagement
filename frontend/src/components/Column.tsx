"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { ColumnWithTasks, CreateTaskRequest, TaskLabel, TaskPriority } from "@tmb/shared";
import { isInProgressColumnName } from "@/lib/columns";
import type { DateFilterField } from "@/lib/dates";
import { taskMatchesDateFilter } from "@/lib/dates";
import { columnDragId, taskDragId } from "@/lib/dnd";
import { taskMatchesSearch } from "@/lib/labels";
import { sortTasks, type TaskSort } from "@/lib/priority";
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
      priority?: TaskPriority;
      labels?: TaskLabel[];
    },
  ) => Promise<void>;
  dateFrom: string;
  dateTo: string;
  dateField: DateFilterField;
  sort: TaskSort;
  search: string;
  onLabelClick: (label: TaskLabel) => void;
  wipLimit: number;
}

export default function Column({
  column,
  index,
  onCreate,
  onDelete,
  onEdit,
  dateFrom,
  dateTo,
  dateField,
  sort,
  search,
  onLabelClick,
  wipLimit,
}: ColumnProps) {
  const accent = ACCENTS[index % ACCENTS.length];
  const { setNodeRef, isOver } = useDroppable({
    id: columnDragId(column.id),
    data: { type: "column", columnId: column.id },
  });
  const visibleTasks = sortTasks(
    column.tasks.filter(
      (task) =>
        taskMatchesDateFilter(task, column.name, dateFrom, dateTo, dateField) &&
        taskMatchesSearch(task, search),
    ),
    sort,
  );
  const filterActive = Boolean(dateFrom || dateTo || search.trim());
  const inProgress = isInProgressColumnName(column.name);
  const overWip = inProgress && column.tasks.length > wipLimit;

  return (
    <section
      className={`flex min-h-[28rem] flex-col rounded-2xl border border-t-4 bg-stone-100/80 p-4 ${accent} ${
        overWip
          ? "border-amber-300 dark:border-amber-800"
          : "border-stone-200 dark:border-stone-700"
      } ${isOver ? "ring-2 ring-teal-500/30" : ""} ${overWip ? "dark:bg-amber-950/20" : "dark:bg-stone-900/80"}`}
    >
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-stone-800 dark:text-stone-100">
          {column.name}
        </h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            overWip
              ? "bg-amber-100 font-medium text-amber-900 dark:bg-amber-900 dark:text-amber-100"
              : "bg-white text-stone-500 dark:bg-stone-800 dark:text-stone-400"
          }`}
        >
          {inProgress
            ? `${column.tasks.length}/${wipLimit}`
            : filterActive
              ? `${visibleTasks.length}/${column.tasks.length}`
              : column.tasks.length}
        </span>
      </header>
      {overWip ? (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs leading-5 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          Too many cards in progress. Finish or move some before starting more.
        </p>
      ) : null}

      <div ref={setNodeRef} className="flex flex-1 flex-col gap-3">
        <SortableContext
          items={visibleTasks.map((task) => taskDragId(task.id))}
          strategy={verticalListSortingStrategy}
        >
          {visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columnName={column.name}
              onDelete={onDelete}
              onEdit={onEdit}
              onLabelClick={onLabelClick}
            />
          ))}
        </SortableContext>
        {column.tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 px-3 py-8 text-center text-xs text-stone-400 dark:border-stone-600 dark:text-stone-500">
            Drop a card here
          </p>
        ) : null}
        {column.tasks.length > 0 && visibleTasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 px-3 py-8 text-center text-xs text-stone-400 dark:border-stone-600 dark:text-stone-500">
            No matching tasks
          </p>
        ) : null}
      </div>

      <AddTaskForm columnId={column.id} columnName={column.name} onCreated={onCreate} />
    </section>
  );
}
