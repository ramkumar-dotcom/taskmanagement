"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearUser, readUser, type AuthUser } from "@/lib/auth";

export default function SiteHeader() {
  const pathname = usePathname();
  const onBoard = pathname === "/board";
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    function sync() {
      setUser(readUser());
    }
    sync();
    window.addEventListener("tmb-auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("tmb-auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#f7f4ef]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-800 text-sm font-bold text-white">
            T
          </span>
          <span className="text-sm font-semibold tracking-tight text-stone-900">
            Task Management Board
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-stone-600 md:flex">
          <Link href="/#features" className="hover:text-stone-900">
            Features
          </Link>
          <Link href="/#how-it-works" className="hover:text-stone-900">
            How it works
          </Link>
          <Link
            href="/board"
            className={onBoard ? "font-medium text-stone-900" : "hover:text-stone-900"}
            aria-current={onBoard ? "page" : undefined}
          >
            Board
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden max-w-[10rem] truncate text-xs text-stone-500 sm:block">
                {user.name}
              </span>
              {onBoard ? (
                <span className="rounded-lg bg-stone-200 px-3 py-1.5 text-sm font-medium text-stone-500">
                  On the board
                </span>
              ) : (
                <Link
                  href="/board"
                  className="rounded-lg bg-teal-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-900"
                >
                  Open board
                </Link>
              )}
              <button
                type="button"
                onClick={() => clearUser()}
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-white"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-white"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-teal-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-900"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
