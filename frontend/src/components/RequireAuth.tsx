"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { readUser } from "@/lib/auth";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const signedIn = typeof window !== "undefined" && Boolean(readUser());

  useEffect(() => {
    if (!readUser()) {
      router.replace("/");
    }
  }, [router]);

  if (!signedIn) {
    return <p className="px-4 py-16 text-center text-sm text-stone-500">Taking you home…</p>;
  }

  return children;
}
