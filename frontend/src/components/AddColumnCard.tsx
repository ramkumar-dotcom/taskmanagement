"use client";

import { useState, type FormEvent } from "react";

interface AddColumnCardProps {
  onCreate: (name: string) => Promise<void>;
}

export default function AddColumnCard({ onCreate }: AddColumnCardProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError("");
    try {
      await onCreate(trimmed);
      setName("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add column");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex min-h-[12rem] w-72 shrink-0 flex-col justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-4 dark:border-stone-600 dark:bg-stone-900/40">
      {open ? (
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Column name"
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-700 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100"
            autoFocus
          />
          {error ? <p className="text-xs text-red-700 dark:text-red-400">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="rounded-lg bg-teal-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-900 disabled:bg-stone-300 dark:disabled:bg-stone-700"
            >
              {busy ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setName("");
                setError("");
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg px-3 py-8 text-sm font-medium text-stone-500 hover:bg-white hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
        >
          + Add column
        </button>
      )}
    </section>
  );
}
