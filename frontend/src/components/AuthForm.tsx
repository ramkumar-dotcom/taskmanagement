"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { readUser, saveUser } from "@/lib/auth";

interface AuthFormProps {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const isRegister = mode === "register";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError("Email and password are required.");
      return;
    }

    if (isRegister) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Name is required.");
        return;
      }
      saveUser({ name: trimmedName, email: trimmedEmail });
      router.push("/board");
      return;
    }

    const existing = readUser();
    if (!existing || existing.email !== trimmedEmail) {
      setError("No account with that email. Register first.");
      return;
    }
    saveUser(existing);
    router.push("/board");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        className="w-full rounded-xl bg-teal-800 py-2.5 text-sm font-medium text-white hover:bg-teal-900"
      >
        {isRegister ? "Create account" : "Log in"}
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
