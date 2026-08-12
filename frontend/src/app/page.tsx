// This file runs on the server first (Next.js App Router).
// It loads the board from the Node API, then hands the data to <Board />,
// which is a Client Component that handles clicks (add / move / delete).

import type { BoardPageData } from "@tmb/shared";
import Board from "@/components/Board";
import { getBoard, getHealth } from "@/lib/api";
import { errorMessage } from "@/lib/parse";

// Always ask the API on each request so new cards show up after refresh.
export const dynamic = "force-dynamic";

async function loadInitial(): Promise<BoardPageData> {
  try {
    const [board, health] = await Promise.all([getBoard(), getHealth()]);
    return {
      board,
      health: {
        label:
          health.database === "connected"
            ? "API + database connected"
            : "API up, database down",
        ok: health.ok,
      },
      error: "",
    };
  } catch (err) {
    return {
      board: null,
      health: { label: "Cannot reach the API", ok: false },
      error: `${errorMessage(err)} — could not load https://taskmanagement-9qrq.vercel.app`,
    };
  }
}

export default async function Home() {
  const initial = await loadInitial();
  return <Board initial={initial} />;
}
