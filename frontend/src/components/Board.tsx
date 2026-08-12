"use client";

import { useEffect, useState } from "react";
import type { BoardPageData, CreateTaskRequest } from "@tmb/shared";
import { createTask, deleteTask, getBoard, getHealth, updateTask } from "@/lib/api";
import { errorMessage } from "@/lib/parse";
import Column from "./Column";

interface BoardProps {
  initial: BoardPageData;
}

export default function Board({ initial }: BoardProps) {
  const [board, setBoard] = useState(initial.board);
  const [health, setHealth] = useState(initial.health);
  const [error, setError] = useState(initial.error);

  useEffect(() => {
    void load();
  }, []);

  async function load(): Promise<void> {
    try {
      const [nextBoard, nextHealth] = await Promise.all([getBoard(), getHealth()]);
      setBoard(nextBoard);
      setHealth({
        label:
          nextHealth.database === "connected"
            ? "API + database connected"
            : "API up, database down",
        ok: nextHealth.ok,
      });
      setError("");
    } catch (err) {
      setHealth({ label: "Cannot reach the API", ok: false });
      setError(`${errorMessage(err)} — check NEXT_PUBLIC_API_URL`);
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
            Boilerplate
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-900">
            Task Management Board
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
            Next.js talks to a Node API, and the API talks to a SQLite file.
            Add, move, and delete cards — they persist in the database.
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs ${
            health.ok
              ? "border-teal-200 bg-teal-50 text-teal-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${health.ok ? "bg-teal-600" : "bg-red-500"}`} />
          {health.label}
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
