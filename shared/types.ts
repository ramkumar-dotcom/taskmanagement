// =============================================================================
// SHARED CONTRACT
// Frontend and backend both import these types so the JSON shape cannot drift.
// Field names match the SQL columns (snake_case) on purpose.
// =============================================================================

export interface Task {
  id: number;
  column_id: number;
  title: string;
  description: string | null;
  position: number;
  created_at: string;
  due_date: string | null;
  start_date: string | null;
  completed_date: string | null;
}

export interface Column {
  id: number;
  board_id: number;
  name: string;
  position: number;
}

export interface ColumnWithTasks extends Column {
  tasks: Task[];
}

export interface Board {
  id: number;
  name: string;
  created_at: string;
}

export interface BoardWithColumns extends Board {
  columns: ColumnWithTasks[];
}

export type DatabaseStatus = "connected" | "disconnected";
export type DatabaseDriver = "sqlite" | "postgres";

export interface HealthResponse {
  ok: boolean;
  service: string;
  database: DatabaseStatus;
  driver?: DatabaseDriver;
  release?: string;
  error?: string;
}

export interface ApiError {
  error: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  columnId: number;
  dueDate?: string;
  startDate?: string;
  completedDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  columnId?: number;
  position?: number;
  dueDate?: string | null;
  startDate?: string | null;
  completedDate?: string | null;
}

export interface BoardHealthState {
  label: string;
  ok: boolean;
}

export interface BoardPageData {
  board: BoardWithColumns | null;
  health: BoardHealthState;
  error: string;
}

export interface PublicUser {
  id: number;
  name: string;
  email: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
