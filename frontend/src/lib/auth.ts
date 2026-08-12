export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

const KEY = "tmb_user";
const BOARD_KEY = "tmb_board_id";

export function readSelectedBoardId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(BOARD_KEY);
  const id = raw ? Number(raw) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function saveSelectedBoardId(boardId: number): void {
  window.localStorage.setItem(BOARD_KEY, String(boardId));
}

export function readUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "name" in parsed &&
      "email" in parsed &&
      typeof parsed.name === "string" &&
      typeof parsed.email === "string"
    ) {
      const id = "id" in parsed ? Number(parsed.id) : 0;
      return { id, name: parsed.name, email: parsed.email };
    }
  } catch {
    return null;
  }
  return null;
}

export function saveUser(user: AuthUser): void {
  window.localStorage.setItem(KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("tmb-auth"));
}

export function clearUser(): void {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("tmb-auth"));
}
