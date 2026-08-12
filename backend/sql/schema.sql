-- =============================================================================
-- DATABASE SCHEMA (SQLite)
-- Think of a schema as the blueprint of your filing cabinets.
-- Tables = cabinets. Rows = individual records. Columns = fields on each record.
--
-- The whole database is one file: backend/data/board.db
-- No Docker. No separate database server.
-- =============================================================================

-- A board is the whole kanban board (we start with one default board).
CREATE TABLE IF NOT EXISTS boards (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A column is one vertical list: To Do / In Progress / Done.
CREATE TABLE IF NOT EXISTS columns (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id   INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  position   INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A task is one card sitting inside a column.
CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  column_id   INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  position       INTEGER NOT NULL DEFAULT 0,
  due_date       TEXT,
  start_date     TEXT,
  completed_date TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes make lookups faster. Not required for a tiny app, but good habit.
CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id);
