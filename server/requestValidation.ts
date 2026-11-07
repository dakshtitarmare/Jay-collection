import type { VercelRequest } from "@vercel/node";
import { ApiError } from "./apiErrors.js";

export const MAX_JSON_BODY_BYTES = 64 * 1024;

export function requireJsonBody(request: VercelRequest) {
  const contentLength = Number(request.headers["content-length"] ?? 0);
  if (contentLength > MAX_JSON_BODY_BYTES) {
    throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Request body is too large.");
  }

  if (request.body === undefined || request.body === null || request.body === "") {
    throw new ApiError(400, "BAD_REQUEST", "A JSON request body is required.");
  }

  if (typeof request.body !== "object" || Array.isArray(request.body)) {
    throw new ApiError(400, "BAD_REQUEST", "The request body must be a JSON object.");
  }

  return request.body as Record<string, unknown>;
}
