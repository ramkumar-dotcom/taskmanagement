"use client";

import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useEffect, useState } from "react";
import type { BoardPageData, CreateTaskRequest } from "@tmb/shared";
import { createTask, deleteTask, getBoard, updateTask } from "@/lib/api";
import { dropIndex, findTask, parseTaskDragId } from "@/lib/dnd";
import { errorMessage } from "@/lib/parse";
import Column from "./Column";

interface BoardProps {
  initial: BoardPageData;
}

export default function Board({ initial }: BoardProps) {
  const [board, setBoard] = useState(initial.board);
  const [error, setError] = useState(initial.error);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
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

  async function handleDragEnd(event: DragEndEvent): Promise<void> {
    if (!board || !event.over) return;
    const taskId = parseTaskDragId(String(event.active.id));
    if (taskId === null) return;

    const current = findTask(board, taskId);
    if (!current) return;

    const dest = dropIndex(board, taskId, String(event.over.id));
    if (!dest) return;
    const sourceColumn = board.columns.find((column) => column.id === current.column_id);
    const visualIndex = sourceColumn?.tasks.findIndex((task) => task.id === taskId) ?? -1;
    if (dest.columnId === current.column_id && dest.position === visualIndex) return;

    const nextColumns = board.columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((task) => task.id !== taskId),
    }));
    const destColumn = nextColumns.find((column) => column.id === dest.columnId);
    if (!destColumn) return;
    destColumn.tasks.splice(dest.position, 0, {
      ...current,
      column_id: dest.columnId,
      position: dest.position,
    });
    setBoard({ ...board, columns: nextColumns });

    try {
      await updateTask(taskId, { columnId: dest.columnId, position: dest.position });
      await load();
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
          Drag a card by the handle to move it. Changes save to your board.
        </p>
      </header>

      {error ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      {board ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={(event) => void handleDragEnd(event)}>
          <div className="grid gap-4 md:grid-cols-3">
            {board.columns.map((column, index) => (
              <Column
                key={column.id}
                column={column}
                index={index}
                onCreate={handleCreate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </DndContext>
      ) : !error ? (
        <p className="text-sm text-stone-500">Loading board…</p>
      ) : null}
    </div>
  );
}
