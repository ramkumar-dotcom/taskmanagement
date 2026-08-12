"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { loginAccount, registerAccount } from "@/lib/api";
import { saveUser } from "@/lib/auth";
import { errorMessage } from "@/lib/parse";

interface AuthFormProps {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    if (!trimmedEmail || !password) {
      setError("Email and password are required.");
      return;
    }
    if (isRegister && !trimmedName) {
      setError("Name is required.");
      return;
    }

    setBusy(true);
    try {
      const user = isRegister
        ? await registerAccount({ name: trimmedName, email: trimmedEmail, password })
        : await loginAccount({ email: trimmedEmail, password });
      saveUser(user);
      router.replace("/board");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      {isRegister ? (
        <label className="block text-sm">
          <span className="text-stone-600">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
            autoComplete="name"
          />
        </label>
      ) : null}

      <label className="block text-sm">
        <span className="text-stone-600">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
          autoComplete="email"
        />
      </label>

      <label className="block text-sm">
        <span className="text-stone-600">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
          autoComplete={isRegister ? "new-password" : "current-password"}
        />
      </label>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-teal-800 py-2.5 text-sm font-medium text-white hover:bg-teal-900 disabled:bg-stone-300"
      >
        {busy ? "Please wait…" : isRegister ? "Create account" : "Log in"}
      </button>

      <p className="text-center text-sm text-stone-500">
        {isRegister ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-teal-800 hover:underline">
              Login
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/register" className="font-medium text-teal-800 hover:underline">
              Register
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
