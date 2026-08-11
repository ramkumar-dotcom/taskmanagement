# Task Management Board

A beginner-friendly **kanban board** starter.

| Piece | What it is | Folder |
| --- | --- | --- |
| Frontend | Next.js + React + Tailwind CSS + TypeScript | `frontend/` |
| Backend | Node.js + Express + TypeScript | `backend/` |
| Shared types | TypeScript contract used by both | `shared/types.ts` |
| Database | SQLite (a SQL file on disk) | `backend/data/board.db` |

You only need **Node.js**. No Docker. No separate database server.

---

## How the three pieces talk

```
  Browser  →  Next.js (:3000)  →  Node API (:4000)  →  SQLite file
  (you)       the board UI        Express routes        backend/data/board.db
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
│   ├── src/db.ts               # opens the SQLite file
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

## Hosting later (do this when the app is ready)

You will host **two** things for now (the database file can travel with the API):

1. **Backend** — deploy the `backend/` folder to [Railway](https://railway.app) or [Render](https://render.com).
   - Start command: `npm start`
   - Env vars: `PORT`, `FRONTEND_ORIGIN` (your Vercel URL)
   - Note: a SQLite file on a host is wiped if the server restarts and the disk is ephemeral. When you need real persistence, we can switch this same SQL to a hosted Postgres (Neon / Supabase).
2. **Frontend** — deploy the `frontend/` folder to [Vercel](https://vercel.com) (made for Next.js).
   - Env var: `NEXT_PUBLIC_API_URL` = your Railway/Render API URL

After hosting, update `FRONTEND_ORIGIN` on the API to your real Vercel address, or the browser will block requests (CORS).

We are not deploying in this boilerplate step. `npm run dev` is enough for now.

---

## What this boilerplate is not (yet)

No login, no drag-and-drop, no multiple boards, no file uploads. Those come next, once this loop feels familiar:

**UI → API → SQL → API → UI.**
