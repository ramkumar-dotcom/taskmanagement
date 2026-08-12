"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearUser, readUser, type AuthUser } from "@/lib/auth";

export default function SiteFooter() {
  const pathname = usePathname();
  const router = useRouter();
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
    <footer className="border-t border-stone-200 bg-stone-900 text-stone-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-sm font-semibold text-white">Task Management Board</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-stone-400">
            A simple kanban for teams who want to see work move — from To Do to Done —
            without the noise of a giant project tool.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Product</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/#features" className="hover:text-white">
                Features
              </Link>
            </li>
            <li>
              {user ? (
                pathname === "/board" ? (
                  <span className="text-stone-500">You are on the board</span>
                ) : (
                  <Link href="/board" className="hover:text-white">
                    Open board
                  </Link>
                )
              ) : (
                <Link href="/board" className="hover:text-white">
                  Live board
                </Link>
              )}
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Account</p>
          <ul className="mt-3 space-y-2 text-sm">
            {user ? (
              <>
                <li className="text-stone-400">{user.name}</li>
                <li>
                  <button
                    type="button"
                    className="hover:text-white"
                    onClick={() => {
                      clearUser();
                      router.replace("/");
                    }}
                  >
                    Log out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/login" className="hover:text-white">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-white">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-stone-500 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Task Management Board. All rights reserved.</p>
          <p>Built for getting work done</p>
        </div>
      </div>
    </footer>
  );
}
