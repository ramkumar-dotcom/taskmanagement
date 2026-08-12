"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { readUser } from "@/lib/auth";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!readUser()) {
      router.replace("/");
      return;
    }
    setOk(true);
  }, [router]);

  if (!ok) {
    return <p className="px-4 py-16 text-center text-sm text-stone-500">Taking you home…</p>;
  }

  return children;
}
