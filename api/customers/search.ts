import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireOwner } from "../../server/authMiddleware.js";
import { allowMethods, sendError, sendSuccess } from "../../server/apiResponse.js";
import { findCustomerByMobile, searchCustomersByName } from "../../server/customerRepository.js";
import { normalizeMobile } from "../../server/customerValidation.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    await requireOwner(request);
    allowMethods(response, request.method ?? "", "GET");
    const query = typeof request.query.q === "string" ? request.query.q.trim() : "";
    if (!query) return sendSuccess(response, { customers: [] });
    const mobile = query.replace(/[\s()-]/g, "");
    if (/^\+?[0-9]{10,15}$/.test(mobile)) {
      const customer = await findCustomerByMobile(normalizeMobile(mobile));
      return sendSuccess(response, { customers: customer && customer.status !== "archived" ? [customer] : [] });
    }
    return sendSuccess(response, { customers: await searchCustomersByName(query, 20) });
  } catch (error) {
    return sendError(response, error);
  }
}
