import type { BoardPageData } from "@tmb/shared";
import Board from "@/components/Board";

// First paint is empty. The browser then calls the public API.
// Server-side fetch from one Vercel project to another was returning 500
// (Deployment Protection / stale function) even when curl to the API worked.
const empty: BoardPageData = {
  board: null,
  health: { label: "Connecting to API…", ok: false },
  error: "",
};

export default function Home() {
  return <Board initial={empty} />;
}
