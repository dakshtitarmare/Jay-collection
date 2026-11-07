import type { VercelRequest } from "@vercel/node";
import { describe, expect, it } from "vitest";
import { ApiError } from "./apiErrors";
import { getBearerTokenForTest } from "./authMiddleware";

function requestWithAuthorization(authorization?: string) {
  return { headers: authorization ? { authorization } : {} } as VercelRequest;
}

describe("bearer token validation", () => {
  it("extracts a bearer token", () => {
    expect(getBearerTokenForTest(requestWithAuthorization("Bearer token-value"))).toBe("token-value");
  });

  it("rejects a missing token", () => {
    expect(() => getBearerTokenForTest(requestWithAuthorization())).toThrowError(ApiError);
  });

  it("rejects a malformed authorization header", () => {
    expect(() => getBearerTokenForTest(requestWithAuthorization("Basic token-value"))).toThrowError(ApiError);
  });
});
