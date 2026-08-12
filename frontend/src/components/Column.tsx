"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import type { ColumnWithTasks, TaskLabel, TaskPriority } from "@tmb/shared";
import { isInProgressColumnName } from "@/lib/columns";
import type { DateFilterField } from "@/lib/dates";
import { taskMatchesDateFilter } from "@/lib/dates";
import { columnDragId, columnSortId, taskDragId } from "@/lib/dnd";
import { taskMatchesSearch } from "@/lib/labels";
import { sortTasks, type TaskSort } from "@/lib/priority";
import { taskMatchesView, type BoardView } from "@/lib/views";
import TaskCard from "./TaskCard";

const ACCENTS = [
  "border-t-stone-400 dark:border-t-stone-300",
  "border-t-amber-400 dark:border-t-amber-300",
  "border-t-teal-500 dark:border-t-teal-400",
] as const;

interface ColumnProps {
  column: ColumnWithTasks;
  index: number;
  onDelete: (taskId: number) => Promise<void>;
  onDuplicate: (taskId: number) => Promise<void>;
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
  view: BoardView;
  onLabelClick: (label: TaskLabel) => void;
  wipLimit: number;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onRename: (columnId: number, name: string) => Promise<void>;
  onMove: (columnId: number, position: number) => Promise<void>;
}

export default function Column({
  column,
  index,
  onDelete,
  onDuplicate,
  onEdit,
  dateFrom,
  dateTo,
  dateField,
  sort,
  search,
  view,
  onLabelClick,
  wipLimit,
  canMoveLeft,
  canMoveRight,
  onRename,
  onMove,
}: ColumnProps) {
  const accent = ACCENTS[index % ACCENTS.length];
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: columnDragId(column.id),
    data: { type: "column", columnId: column.id },
  });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: columnSortId(column.id),
    data: { type: "column-sort", columnId: column.id },
  });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(column.name);
  const [renameError, setRenameError] = useState("");
  const visibleTasks = sortTasks(
    column.tasks.filter(
      (task) =>
        taskMatchesDateFilter(task, column.name, dateFrom, dateTo, dateField) &&
        taskMatchesSearch(task, search) &&
        taskMatchesView(task, column.name, view),
    ),
    sort,
  );
  const filterActive = Boolean(dateFrom || dateTo || search.trim() || view !== "all");
  const inProgress = isInProgressColumnName(column.name);
  const overWip = inProgress && column.tasks.length > wipLimit;

  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === column.name) {
      setName(column.name);
      setEditing(false);
      return;
    }
    try {
      await onRename(column.id, trimmed);
      setEditing(false);
      setRenameError("");
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : "Could not rename");
    }
  }

  function handleRenameKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setName(column.name);
      setEditing(false);
      setRenameError("");
    }
  }

  return (
    <section
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)",
      }}
      className={`flex min-h-[28rem] w-72 shrink-0 flex-col rounded-2xl border border-t-4 bg-stone-100/80 p-4 ${accent} ${
        overWip
          ? "border-x-amber-300 border-b-amber-300 dark:border-x-amber-800 dark:border-b-amber-800"
          : "border-x-stone-200 border-b-stone-200 dark:border-x-stone-700 dark:border-b-stone-700"
      } ${isOver ? "ring-2 ring-teal-500/30" : ""} ${overWip ? "dark:bg-amber-950/20" : "dark:bg-stone-900/80"} ${
        isDragging ? "z-10 opacity-60" : ""
      }`}
    >
      <header className="mb-3 space-y-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="cursor-grab rounded px-1 text-stone-400 hover:bg-stone-200 hover:text-stone-700 active:cursor-grabbing dark:hover:bg-stone-800 dark:hover:text-stone-200"
            aria-label={`Reorder ${column.name}`}
            {...attributes}
            {...listeners}
          >
            ⋮⋮
          </button>
          {editing ? (
            <form onSubmit={(event) => void handleRename(event)} className="min-w-0 flex-1">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={handleRenameKey}
                onBlur={() => {
                  if (name.trim() && name.trim() !== column.name) {
                    void onRename(column.id, name.trim())
                      .then(() => {
                        setEditing(false);
                        setRenameError("");
                      })
                      .catch((err: unknown) => {
                        setRenameError(err instanceof Error ? err.message : "Could not rename");
                      });
                    return;
                  }
                  setName(column.name);
                  setEditing(false);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-sm font-semibold outline-none focus:border-teal-700 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-50"
                autoFocus
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setName(column.name);
                setEditing(true);
              }}
              className="min-w-0 flex-1 truncate text-left text-sm font-semibold tracking-wide text-stone-800 hover:text-teal-800 dark:text-stone-100 dark:hover:text-teal-300"
              title="Rename column"
            >
              {column.name}
            </button>
          )}
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
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={!canMoveLeft}
            onClick={() => {
              void onMove(column.id, index - 1);
            }}
            className="rounded px-1.5 text-xs text-stone-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-stone-800 dark:text-stone-400"
            aria-label={`Move ${column.name} left`}
          >
            ←
          </button>
          <button
            type="button"
            disabled={!canMoveRight}
            onClick={() => {
              void onMove(column.id, index + 1);
            }}
            className="rounded px-1.5 text-xs text-stone-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-stone-800 dark:text-stone-400"
            aria-label={`Move ${column.name} right`}
          >
            →
          </button>
        </div>
        {renameError ? <p className="text-xs text-red-700 dark:text-red-400">{renameError}</p> : null}
      </header>
      {overWip ? (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs leading-5 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          Too many cards in progress. Finish or move some before starting more.
        </p>
      ) : null}

      <div ref={setDropRef} className="flex flex-1 flex-col gap-3">
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
              onDuplicate={onDuplicate}
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
    </section>
  );
}
