import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "node:crypto";
import { requireOwner } from "../../../server/authMiddleware";
import { allowMethods, sendError, sendSuccess } from "../../../server/apiResponse";
import { findCustomerById, listMeasurementHistory, writeMeasurement } from "../../../server/customerRepository";
import { validateMeasurementInput } from "../../../server/customerValidation";
import type { MeasurementHistoryRecord } from "../../../server/customerTypes";
import { appendMeasurement, upsertCustomer } from "../../../server/sheetsBackup";
import { ApiError } from "../../../server/apiErrors";
import { requireJsonBody } from "../../../server/requestValidation";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    const owner = await requireOwner(request);
    allowMethods(response, request.method ?? "", "GET", "POST");
    const customerId = typeof request.query.id === "string" ? request.query.id : "";
    const customer = await findCustomerById(customerId);
    if (!customer) throw new ApiError(404, "BAD_REQUEST", "Customer was not found.");

    if (request.method === "GET") {
      return sendSuccess(response, { history: await listMeasurementHistory(customerId) });
    }

    if (customer.status === "archived") {
      throw new ApiError(400, "BAD_REQUEST", "Archived customers cannot receive new measurements.");
    }
    const input = validateMeasurementInput(requireJsonBody(request));
    const now = Date.now();
    const measurementId = `meas_${randomUUID()}`;
    const history: MeasurementHistoryRecord = {
      measurementId,
      customerId,
      garmentType: input.garmentType,
      unit: input.unit,
      values: input.values,
      createdAt: now,
      createdBy: owner.uid,
      ...(input.notes ? { notes: input.notes } : {}),
      ...(input.height !== undefined ? { height: input.height } : {}),
      ...(input.weight !== undefined ? { weight: input.weight } : {}),
      ...(input.reason ? { reason: input.reason } : {}),
    };
    const updatedCustomer = {
      ...customer,
      currentMeasurements: {
        garmentType: input.garmentType,
        unit: input.unit,
        values: input.values,
        ...(input.notes ? { notes: input.notes } : {}),
        ...(input.height ? { height: input.height } : {}),
        ...(input.weight ? { weight: input.weight } : {}),
        updatedAt: now,
      },
      currentMeasurementId: measurementId,
      updatedAt: now,
    };
    await writeMeasurement(updatedCustomer, history);
    try {
      await upsertCustomer(updatedCustomer);
      await appendMeasurement(updatedCustomer, history);
    } catch (error) {
      console.error("Measurement saved to RTDB but Sheets backup failed", error instanceof Error ? error.message : "unknown error");
      return sendSuccess(response, { history, backupStatus: "pending" }, 202);
    }
    return sendSuccess(response, { history, backupStatus: "synced" }, 201);
  } catch (error) {
    return sendError(response, error);
  }
}
