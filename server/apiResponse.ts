import type { VercelResponse } from "@vercel/node";
import { ApiError } from "./apiErrors.js";

export function sendSuccess<T>(response: VercelResponse, data: T, status = 200) {
  return response.status(status).json({ data });
}

export function sendError(response: VercelResponse, error: unknown) {
  if (error instanceof ApiError) {
    return response.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
  }

  console.error("Unhandled API error", error instanceof Error ? error.message : "unknown error");
  return response.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected server error occurred." },
  });
}

export function allowMethods(response: VercelResponse, method: string, ...allowed: string[]) {
  if (!allowed.includes(method)) {
    response.setHeader("Allow", allowed.join(", "));
    throw new ApiError(405, "METHOD_NOT_ALLOWED", "This HTTP method is not supported.");
  }
}
