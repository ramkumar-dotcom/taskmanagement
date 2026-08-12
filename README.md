# Task Management Board

A beginner-friendly **kanban board** starter.

| Piece | What it is | Folder |
| --- | --- | --- |
| Frontend | Next.js + React + Tailwind CSS + TypeScript | `frontend/` |
| Backend | Node.js + Express + TypeScript | `backend/` |
| Shared types | TypeScript contract used by both | `shared/types.ts` |
| Database (local) | SQLite file | `backend/data/board.db` |
| Database (live) | Neon Postgres | set `DATABASE_URL` |

You only need **Node.js** on your machine. Hosting is **Vercel + Neon** — see [HOSTING.md](./HOSTING.md).

---

## How the three pieces talk

```
  Local:   Browser → Next.js (:3000) → Node API (:4000) → SQLite file
  Live:    Browser → Vercel frontend → Vercel Express  → Neon Postgres
```

1. You click **Add task** in the browser.
2. Next.js sends HTTP JSON to `http://localhost:4000/api/tasks`.
3. Express validates the data and runs SQL.
4. SQLite stores the row in `board.db`. The next page load reads it back.

That is all a backend is: receive a request, talk to the database, send JSON back.

---

## What you need installed

- [Node.js 20+](https://nodejs.org/) (you already have this if `node -v` works)
- A terminal (PowerShell is fine)

---

## Run it (first time)

From this folder (`task-management-board`):

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
npm install
npm run install:all
npm run dev
```

On macOS / Linux use `cp` instead of `copy`.

The API creates `backend/data/board.db` and the sample cards on first start.

Then open [http://localhost:3000](http://localhost:3000).

Useful URLs:

| URL | What you should see |
| --- | --- |
| http://localhost:3000 | The kanban board |
| http://localhost:4000/api/health | `{ "ok": true, "database": "connected" }` |
| http://localhost:4000/api/board | JSON of columns + tasks |

---

## Project map

```
task-management-board/
├── shared/types.ts             # Board, Task, API shapes (both sides import this)
├── backend/
│   ├── src/index.ts            # Express server (start here)
│   ├── src/db.ts               # SQLite locally, Neon Postgres when DATABASE_URL is set
│   ├── src/config.ts           # reads .env
│   ├── src/routes/             # /api/health  /api/board  /api/tasks
│   ├── sql/schema.sql          # CREATE TABLE …
│   ├── sql/seed.sql            # sample cards
│   ├── data/board.db           # created automatically (not in git)
│   └── scripts/setup-db.ts     # npm run db:reset
└── frontend/
    ├── src/app/page.tsx        # Next.js home page
    ├── src/components/         # Board, Column, TaskCard
    └── src/lib/api.ts          # fetch() calls to the Node API
```

Read the comments in `backend/src/index.ts` and `backend/src/db.ts` first. They explain the backend in plain language.

Check types without running the app:

```bash
npm run typecheck
```

---

## API cheatsheet

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/api/health` | Is the server and database alive? |
| GET | `/api/board` | One board, its columns, its tasks |
| POST | `/api/tasks` | Create a card `{ title, columnId }` |
| PATCH | `/api/tasks/:id` | Rename or move `{ title?, columnId? }` |
| DELETE | `/api/tasks/:id` | Delete a card |

SQL lives in `backend/sql/`. Node never invents tables — the schema file is the source of truth.

---

## Common problems

**`Cannot reach the API`**
The Node server is not running. From the project root: `npm run dev:backend`. Then visit http://localhost:4000/api/health.

**I want a clean database**
```bash
npm run db:reset
```

That deletes `backend/data/board.db` and recreates the sample cards.

---

## Hosting (Vercel + Neon)

Step-by-step: **[HOSTING.md](./HOSTING.md)**.

Short version:

1. Create a Neon project and copy the **pooled** `DATABASE_URL`.
2. Vercel project 1 — root `backend` — env: `DATABASE_URL`, `FRONTEND_ORIGIN`.
3. Vercel project 2 — root `frontend` — env: `NEXT_PUBLIC_API_URL`.
4. Put the real frontend URL into the API’s `FRONTEND_ORIGIN`, redeploy the API.

---

## What this app is not (yet)

No login, no drag-and-drop, no multiple boards, no file uploads. Those come next, once this loop feels familiar:

**UI → API → SQL → API → UI.**
