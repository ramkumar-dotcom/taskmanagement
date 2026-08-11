import type {
  ApiError,
  BoardWithColumns,
  ColumnWithTasks,
  HealthResponse,
  Task,
} from "@tmb/shared";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong";
}

export function getApiErrorMessage(value: unknown, fallback: string): string {
  if (isRecord(value) && typeof value.error === "string") {
    return value.error;
  }
  return fallback;
}

export function isApiError(value: unknown): value is ApiError {
  return isRecord(value) && typeof value.error === "string";
}

export function parseHealth(value: unknown): HealthResponse {
  if (
    isRecord(value) &&
    typeof value.ok === "boolean" &&
    typeof value.service === "string" &&
    (value.database === "connected" || value.database === "disconnected")
  ) {
    return {
      ok: value.ok,
      service: value.service,
      database: value.database,
      ...(value.driver === "sqlite" || value.driver === "postgres"
        ? { driver: value.driver }
        : {}),
      ...(typeof value.error === "string" ? { error: value.error } : {}),
    };
  }
  throw new Error("API /health returned an unexpected shape");
}

function parseTask(value: unknown): Task {
  if (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.column_id === "number" &&
    typeof value.title === "string" &&
    (typeof value.description === "string" || value.description === null) &&
    typeof value.position === "number" &&
    typeof value.created_at === "string"
  ) {
    return {
      id: value.id,
      column_id: value.column_id,
      title: value.title,
      description: value.description,
      position: value.position,
      created_at: value.created_at,
    };
  }
  throw new Error("API returned a task with an unexpected shape");
}

function parseColumn(value: unknown): ColumnWithTasks {
  if (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.board_id === "number" &&
    typeof value.name === "string" &&
    typeof value.position === "number" &&
    Array.isArray(value.tasks)
  ) {
    return {
      id: value.id,
      board_id: value.board_id,
      name: value.name,
      position: value.position,
      tasks: value.tasks.map(parseTask),
    };
  }
  throw new Error("API returned a column with an unexpected shape");
}

export function parseBoard(value: unknown): BoardWithColumns {
  if (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    typeof value.created_at === "string" &&
    Array.isArray(value.columns)
  ) {
    return {
      id: value.id,
      name: value.name,
      created_at: value.created_at,
      columns: value.columns.map(parseColumn),
    };
  }
  throw new Error("API /board returned an unexpected shape");
}

export function parseTaskResponse(value: unknown): Task {
  return parseTask(value);
}
