import { Router } from "express";
import type { PublicUser } from "@tmb/shared";
import { describeError, ensureDatabase, query } from "../db";
import { hashPassword, verifyPassword } from "../password";

const router = Router();

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toPublic(row: UserRow): PublicUser {
  return { id: Number(row.id), name: row.name, email: row.email };
}

router.post("/register", async (req, res) => {
  const name = asText(req.body?.name);
  const email = asText(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required." });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }

  try {
    try {
      await ensureDatabase();
    } catch {
      // users table may already exist
    }

    const existing = await query<UserRow>("SELECT id, name, email, password_hash FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows[0]) {
      res.status(409).json({ error: "That email is already registered. Use Login." });
      return;
    }

    const created = await query<UserRow>(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, password_hash`,
      [name, email, hashPassword(password)],
    );
    const user = created.rows[0];
    if (!user) {
      res.status(500).json({ error: "Could not create the account." });
      return;
    }
    res.status(201).json(toPublic(user));
  } catch (err) {
    console.error("POST /api/register failed:", err);
    res.status(500).json({ error: describeError(err) });
  }
});

router.post("/login", async (req, res) => {
  const email = asText(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  try {
    try {
      await ensureDatabase();
    } catch {
      // ignore
    }

    const found = await query<UserRow>("SELECT id, name, email, password_hash FROM users WHERE email = $1", [
      email,
    ]);
    const user = found.rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: "Email or password is wrong." });
      return;
    }
    res.json(toPublic(user));
  } catch (err) {
    console.error("POST /api/login failed:", err);
    res.status(500).json({ error: describeError(err) });
  }
});

export default router;
