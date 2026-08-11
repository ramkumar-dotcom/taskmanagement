// Vercel entry. If anything throws while loading the app, return JSON
// instead of FUNCTION_INVOCATION_FAILED with no message.

import type { IncomingMessage, ServerResponse } from "node:http";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const { default: app } = await import("../src/app");
    app(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown boot error";
    console.error("Vercel function boot failed:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          ok: false,
          error: message,
        }),
      );
    }
  }
}
