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
}

export default function BoardSwitcher({
  boards,
  selectedId,
  onSelect,
  onCreate,
}: BoardSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
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
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400">
          Board
        </span>
        <select
          value={selectedId ?? ""}
          onChange={(event) => onSelect(Number(event.target.value))}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-teal-700"
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
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400">
              New board name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Sprint planning"
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-700"
              autoFocus
            />
          </label>
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="rounded-lg bg-teal-800 px-3 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:bg-stone-300"
          >
            {busy ? "Creating…" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setError("");
            }}
            className="rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
        >
          New board
        </button>
      )}
      {error ? <p className="w-full text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
