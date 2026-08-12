"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import { useEffect, useState } from "react";
import type { BoardPageData, CreateTaskRequest, Task } from "@tmb/shared";
import { createTask, deleteTask, getBoard, updateTask } from "@/lib/api";
import { dropIndex, findTask, moveTask, parseTaskDragId } from "@/lib/dnd";
import { errorMessage } from "@/lib/parse";
import Column from "./Column";
import { TaskCardFace } from "./TaskCard";

const dropAnimation: DropAnimation = {
  duration: 220,
  easing: "cubic-bezier(0.25, 1, 0.5, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.3" } },
  }),
};

interface BoardProps {
  initial: BoardPageData;
}

export default function Board({ initial }: BoardProps) {
  const [board, setBoard] = useState(initial.board);
  const [error, setError] = useState(initial.error);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    void load();
  }, []);

  async function load(): Promise<void> {
    try {
      setBoard(await getBoard());
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleCreate({ title, columnId }: CreateTaskRequest): Promise<void> {
    await createTask({ title, columnId });
    await load();
  }

  async function handleDelete(taskId: number): Promise<void> {
    await deleteTask(taskId);
    await load();
  }

  async function handleEdit(
    taskId: number,
    fields: { title: string; description: string },
  ): Promise<void> {
    await updateTask(taskId, fields);
    await load();
  }

  function handleDragStart(event: DragStartEvent): void {
    if (!board) return;
    const taskId = parseTaskDragId(String(event.active.id));
    if (taskId === null) return;
    setActiveTask(findTask(board, taskId) ?? null);
  }

  function handleDragOver(event: DragOverEvent): void {
    if (!board || !event.over) return;
    const taskId = parseTaskDragId(String(event.active.id));
    if (taskId === null) return;

    const dest = dropIndex(board, taskId, String(event.over.id));
    if (!dest) return;

    const current = findTask(board, taskId);
    if (!current) return;
    const sourceColumn = board.columns.find((column) => column.id === current.column_id);
    const visualIndex = sourceColumn?.tasks.findIndex((task) => task.id === taskId) ?? -1;
    if (dest.columnId === current.column_id && dest.position === visualIndex) return;

    setBoard(moveTask(board, taskId, dest.columnId, dest.position));
  }

  async function handleDragEnd(): Promise<void> {
    const dragging = activeTask;
    setActiveTask(null);
    if (!board || !dragging) return;

    const current = findTask(board, dragging.id);
    if (!current) return;

    try {
      await updateTask(dragging.id, {
        columnId: current.column_id,
        position: current.position,
      });
    } catch (err) {
      setError(errorMessage(err));
      await load();
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">
          Workspace
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-900">
          Task Management Board
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
          Drag any card to another column or to a new spot in the list.
        </p>
      </header>

      {error ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      {board ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={() => void handleDragEnd()}
          onDragCancel={() => setActiveTask(null)}
        >
          <div className="grid gap-4 md:grid-cols-3">
            {board.columns.map((column, index) => (
              <Column
                key={column.id}
                column={column}
                index={index}
                onCreate={handleCreate}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={dropAnimation}>
            {activeTask ? <TaskCardFace task={activeTask} overlay /> : null}
          </DragOverlay>
        </DndContext>
      ) : !error ? (
        <p className="text-sm text-stone-500">Loading board…</p>
      ) : null}
    </div>
  );
}
