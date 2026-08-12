"use client";

import { useEffect, useState } from "react";
import type { BoardPageData, CreateTaskRequest } from "@tmb/shared";
import { createTask, deleteTask, getBoard, updateTask } from "@/lib/api";
import { errorMessage } from "@/lib/parse";
import Column from "./Column";

interface BoardProps {
  initial: BoardPageData;
}

export default function Board({ initial }: BoardProps) {
  const [board, setBoard] = useState(initial.board);
  const [error, setError] = useState(initial.error);

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

  async function handleMove(taskId: number, columnId: number): Promise<void> {
    await updateTask(taskId, { columnId });
    await load();
  }

  async function handleDelete(taskId: number): Promise<void> {
    await deleteTask(taskId);
    await load();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">
            Workspace
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-900">
            Task Management Board
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
            Add a card, move it across columns, and check it off when it&apos;s done.
          </p>
        </div>
      </header>

      {error ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      {board ? (
        <div className="grid gap-4 md:grid-cols-3">
          {board.columns.map((column, index) => (
            <Column
              key={column.id}
              column={column}
              index={index}
              columns={board.columns}
              onCreate={handleCreate}
              onMove={handleMove}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : !error ? (
        <p className="text-sm text-stone-500">Loading board…</p>
      ) : null}
    </div>
  );
}
