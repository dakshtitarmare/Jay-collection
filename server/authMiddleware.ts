import type { VercelRequest } from "@vercel/node";
import { ApiError } from "./apiErrors";
import { getFirebaseAdminAuth } from "./firebaseAdmin";

function getBearerToken(request: VercelRequest) {
  const authorization = request.headers.authorization;
  if (!authorization) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  return match[1];
}

export async function requireOwner(request: VercelRequest) {
  const token = getBearerToken(request);
  let decodedToken;

  try {
    decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);
  } catch {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const ownerUid = process.env.J_COLLECTION_OWNER_UID;
  if (!ownerUid) {
    throw new Error("Missing required server environment variable: J_COLLECTION_OWNER_UID");
  }

  if (decodedToken.uid !== ownerUid) {
    throw new ApiError(403, "FORBIDDEN", "You are not authorized to access this resource.");
  }

  return decodedToken;
}

export function getBearerTokenForTest(request: VercelRequest) {
  return getBearerToken(request);
}
