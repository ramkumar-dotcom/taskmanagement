"use client";

import { useState, type FormEvent } from "react";
import type { CreateTaskRequest } from "@tmb/shared";
import { errorMessage } from "@/lib/parse";

interface AddTaskFormProps {
  columnId: number;
  onCreated: (input: CreateTaskRequest) => Promise<void>;
}

export default function AddTaskForm({ columnId, onCreated }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || busy) return;

    setBusy(true);
    setError("");
    try {
      await onCreated({ title: title.trim(), columnId });
      setTitle("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Add a task…"
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
      />
      <button
        type="submit"
        disabled={busy || !title.trim()}
        className="w-full rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {busy ? "Saving…" : "Add task"}
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </form>
  );
}
