-- Neon / Postgres schema + seed.
-- Runtime uses backend/src/sql-scripts.ts (same SQL) so Vercel can bundle it.

CREATE TABLE IF NOT EXISTS boards (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS columns (
  id         SERIAL PRIMARY KEY,
  board_id   INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name       VARCHAR(80) NOT NULL,
  position   INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  column_id   INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  position       INTEGER NOT NULL DEFAULT 0,
  due_date       DATE,
  start_date     DATE,
  completed_date DATE,
  priority       VARCHAR(10) NOT NULL DEFAULT 'medium',
  labels         TEXT NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id);
