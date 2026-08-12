import type { BoardPageData } from "@tmb/shared";
import Board from "@/components/Board";
import RequireAuth from "@/components/RequireAuth";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

const empty: BoardPageData = {
  board: null,
  health: { label: "Connecting to API…", ok: false },
  error: "",
};

export default function BoardPage() {
  return (
    <div className="min-h-full">
      <SiteHeader />
      <RequireAuth>
        <Board initial={empty} />
      </RequireAuth>
      <SiteFooter />
    </div>
  );
}
