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
  error?: string;
}

export interface ApiError {
  error: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  columnId: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  columnId?: number;
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
