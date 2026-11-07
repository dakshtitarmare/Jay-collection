import { getFirebaseAuth } from "./firebaseClient";

type ApiEnvelope<T> = { data: T; error?: never } | { error: { code: string; message: string }; data?: never };

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Please sign in again.");
  const token = await user.getIdToken();
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const rawBody = await response.text();
  let body: ApiEnvelope<T> | null = null;
  if (rawBody) {
    try {
      body = JSON.parse(rawBody) as ApiEnvelope<T>;
    } catch {
      throw new Error(
        response.status === 404
          ? "API route not found. Run the app with `npm run dev` (Vercel local runtime) instead of `npm run dev:vite`."
          : `The server returned an invalid response (HTTP ${response.status}).`,
      );
    }
  }
  if (!body) {
    throw new Error(`The server returned an empty response (HTTP ${response.status}).`);
  }
  if (!response.ok || "error" in body) {
    throw new Error(body.error?.message ?? "Request failed.");
  }
  return body.data;
}

export function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(timestamp);
}
