import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireOwner } from "../../../server/authMiddleware";
import { allowMethods, sendError, sendSuccess } from "../../../server/apiResponse";
import { findCustomerById, updateCustomer } from "../../../server/customerRepository";
import { upsertCustomer } from "../../../server/sheetsBackup";
import { ApiError } from "../../../server/apiErrors";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    await requireOwner(request);
    allowMethods(response, request.method ?? "", "POST");
    const customerId = typeof request.query.id === "string" ? request.query.id : "";
    const customer = await findCustomerById(customerId);
    if (!customer) throw new ApiError(404, "BAD_REQUEST", "Customer was not found.");
    const updated = { ...customer, status: "archived" as const, archivedAt: Date.now(), updatedAt: Date.now() };
    await updateCustomer(customerId, updated);
    try {
      await upsertCustomer(updated);
    } catch (error) {
      console.error("Customer archived in RTDB but Sheets backup failed", error instanceof Error ? error.message : "unknown error");
      return sendSuccess(response, { customer: updated, backupStatus: "pending" }, 202);
    }
    return sendSuccess(response, { customer: updated, backupStatus: "synced" });
  } catch (error) {
    return sendError(response, error);
  }
}
