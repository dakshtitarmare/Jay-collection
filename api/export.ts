import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireOwner } from "../server/authMiddleware.js";
import { allowMethods, sendError, sendSuccess } from "../server/apiResponse.js";
import { exportCustomers } from "../server/exportRepository.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    await requireOwner(request);
    allowMethods(response, request.method ?? "", "GET");
    const data = await exportCustomers();
    return sendSuccess(response, data);
  } catch (error) {
    return sendError(response, error);
  }
}
