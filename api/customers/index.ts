import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "node:crypto";
import { requireOwner } from "../../server/authMiddleware.js";
import { allowMethods, sendError, sendSuccess } from "../../server/apiResponse.js";
import { findCustomerByMobile, listCustomers, writeCustomer } from "../../server/customerRepository.js";
import { validateCustomerInput } from "../../server/customerValidation.js";
import type { Customer } from "../../server/customerTypes.js";
import { upsertCustomer } from "../../server/sheetsBackup.js";
import { ApiError } from "../../server/apiErrors.js";
import { requireJsonBody } from "../../server/requestValidation.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    await requireOwner(request);
    allowMethods(response, request.method ?? "", "GET", "POST");

    if (request.method === "GET") {
      const limit = Math.min(Math.max(Number(request.query.limit ?? 20), 1), 100);
      const cursor = typeof request.query.cursor === "string" ? request.query.cursor : undefined;
      return sendSuccess(response, await listCustomers(limit, cursor));
    }

    const input = validateCustomerInput(requireJsonBody(request));
    const existing = await findCustomerByMobile(input.mobile);
    if (existing) {
      throw new ApiError(409, "CONFLICT", "A customer with this mobile number already exists.");
    }

    const now = Date.now();
    const customer: Customer = {
      ...input,
      customerId: `cust_${randomUUID()}`,
      nameLower: input.name.toLowerCase(),
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    await writeCustomer(customer);
    try {
      await upsertCustomer(customer);
    } catch (error) {
      await writeCustomer({ ...customer, notes: `${customer.notes ? `${customer.notes} ` : ""}[Sheets backup pending]` });
      console.error("Customer saved to RTDB but Sheets backup failed", error instanceof Error ? error.message : "unknown error");
      return sendSuccess(response, { customer, backupStatus: "pending" }, 202);
    }
    return sendSuccess(response, { customer, backupStatus: "synced" }, 201);
  } catch (error) {
    return sendError(response, error);
  }
}
