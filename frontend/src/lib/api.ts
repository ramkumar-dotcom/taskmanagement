// =============================================================================
// FRONTEND → BACKEND
// Every call to the Node API goes through this file.
// NEXT_PUBLIC_* env vars are visible in the browser — that is why the API
// URL is public. Secrets stay on the backend only.
// =============================================================================

import type {
  BoardWithColumns,
  CreateTaskRequest,
  HealthResponse,
  Task,
  UpdateTaskRequest,
} from "@tmb/shared";
import { getApiErrorMessage, parseBoard, parseHealth, parseTaskResponse } from "./parse";

const PRODUCTION_API = "https://taskmanagement-9qrq.vercel.app";

function resolveApiUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  // Preview URLs look like taskmanagement-9qrq-<hash>-rameshs-projects-....vercel.app
  // Those deploys are old and /api/board returns 500. Always use Production.
  const isPreviewApi =
    raw.includes("-rameshs-projects-") ||
    raw.includes("-git-") ||
    /taskmanagement-9qrq-[a-z0-9]+/i.test(raw);
  if (isPreviewApi || (!raw && process.env.VERCEL)) {
    return PRODUCTION_API;
  }
  if (raw) return raw;
  return "http://localhost:4000";
}

const API_URL = resolveApiUrl();

async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  if (response.status === 204) return null;

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, `Request failed (${response.status})`));
  }

  return data;
}

export function getApiUrl(): string {
  return API_URL;
}

export async function getHealth(): Promise<HealthResponse> {
  return parseHealth(await request("/api/health"));
}

export async function getBoard(): Promise<BoardWithColumns> {
  return parseBoard(await request("/api/board"));
}

export async function createTask(body: CreateTaskRequest): Promise<Task> {
  return parseTaskResponse(
    await request("/api/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

export async function updateTask(id: number, body: UpdateTaskRequest): Promise<Task> {
  return parseTaskResponse(
    await request(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  );
}

export async function deleteTask(id: number): Promise<void> {
  await request(`/api/tasks/${id}`, { method: "DELETE" });
}
