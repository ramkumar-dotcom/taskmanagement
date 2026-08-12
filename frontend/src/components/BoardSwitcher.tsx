"use client";

import { useState, type FormEvent } from "react";

interface BoardOption {
  id: number;
  name: string;
}

interface BoardSwitcherProps {
  boards: BoardOption[];
  selectedId: number | null;
  onSelect: (boardId: number) => void;
  onCreate: (name: string) => Promise<void>;
  onDuplicate: () => Promise<void>;
}

export default function BoardSwitcher({
  boards,
  selectedId,
  onSelect,
  onCreate,
  onDuplicate,
}: BoardSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
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
      setError(err instanceof Error ? err.message : "Could not create board");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex flex-wrap items-end gap-3">
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
          Board
        </span>
        <select
          value={selectedId ?? ""}
          onChange={(event) => onSelect(Number(event.target.value))}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-teal-700 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100"
        >
          {boards.length === 0 ? <option value="">No boards yet</option> : null}
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>
      </label>

      {open ? (
        <form onSubmit={(event) => void handleCreate(event)} className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
              New board name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Sprint planning"
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-700 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100"
              autoFocus
            />
          </label>
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="rounded-lg bg-teal-800 px-3 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:bg-stone-300 dark:disabled:bg-stone-700"
          >
            {busy ? "Creating…" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setError("");
            }}
            className="rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Cancel
          </button>
        </form>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100 dark:hover:bg-stone-800"
          >
            New board
          </button>
          <button
            type="button"
            disabled={duplicating || selectedId === null}
            onClick={() => {
              void (async () => {
                setDuplicating(true);
                setError("");
                try {
                  await onDuplicate();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Could not duplicate board");
                } finally {
                  setDuplicating(false);
                }
              })();
            }}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100 dark:hover:bg-stone-800"
          >
            {duplicating ? "Copying…" : "Duplicate board"}
          </button>
        </>
      )}
      {error ? <p className="w-full text-sm text-red-700 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
