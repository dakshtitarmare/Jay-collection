import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireOwner } from "../../server/authMiddleware.js";
import { allowMethods, sendError, sendSuccess } from "../../server/apiResponse.js";
import { findCustomerById, updateCustomer } from "../../server/customerRepository.js";
import { validateCustomerInput } from "../../server/customerValidation.js";
import { upsertCustomer } from "../../server/sheetsBackup.js";
import { ApiError } from "../../server/apiErrors.js";
import { requireJsonBody } from "../../server/requestValidation.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    await requireOwner(request);
    allowMethods(response, request.method ?? "", "GET", "PATCH");
    const customerId = typeof request.query.id === "string" ? request.query.id : "";
    const customer = await findCustomerById(customerId);
    if (!customer) throw new ApiError(404, "BAD_REQUEST", "Customer was not found.");

    if (request.method === "GET") return sendSuccess(response, { customer });

    const input = validateCustomerInput(requireJsonBody(request));
    const updated = { ...customer, ...input, nameLower: input.name.toLowerCase(), updatedAt: Date.now() };
    await updateCustomer(customerId, updated, customer.mobile);
    try {
      await upsertCustomer(updated);
    } catch (error) {
      console.error("Customer updated in RTDB but Sheets backup failed", error instanceof Error ? error.message : "unknown error");
      return sendSuccess(response, { customer: updated, backupStatus: "pending" }, 202);
    }
    return sendSuccess(response, { customer: updated, backupStatus: "synced" });
  } catch (error) {
    return sendError(response, error);
  }
}
