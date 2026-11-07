import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allowMethods, sendError, sendSuccess } from "../server/apiResponse.js";

export default function handler(request: VercelRequest, response: VercelResponse) {
  try {
    allowMethods(response, request.method ?? "", "GET");
    return sendSuccess(response, {
      ok: true,
      service: "Jay-Collection-api",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return sendError(response, error);
  }
}
