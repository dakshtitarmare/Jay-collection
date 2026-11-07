import { ApiError } from "./apiErrors";
import type { MeasurementSet } from "./customerTypes";

const mobilePattern = /^\+?[0-9]{10,15}$/;

export function normalizeMobile(value: unknown) {
  if (typeof value !== "string") {
    throw new ApiError(400, "BAD_REQUEST", "Mobile number is required.");
  }
  const normalized = value.replace(/[\s()-]/g, "");
  if (!mobilePattern.test(normalized)) {
    throw new ApiError(400, "BAD_REQUEST", "Enter a valid mobile number.");
  }
  return normalized;
}

function optionalString(value: unknown, field: string, maxLength: number) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw new ApiError(400, "BAD_REQUEST", `${field} is invalid.`);
  }
  return value.trim();
}

function optionalNumber(value: unknown, field: string, min: number, max: number) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new ApiError(400, "BAD_REQUEST", `${field} must be a valid number.`);
  }
  return value;
}

export function validateCustomerInput(body: Record<string, unknown>) {
  const name = optionalString(body.name, "Name", 120);
  if (!name) throw new ApiError(400, "BAD_REQUEST", "Name is required.");

  return {
    name,
    mobile: normalizeMobile(body.mobile),
    email: optionalString(body.email, "Email", 160),
    age: optionalNumber(body.age, "Age", 0, 130),
    notes: optionalString(body.notes, "Notes", 2000),
  };
}

export function validateMeasurementInput(body: Record<string, unknown>) {
  const garmentType = optionalString(body.garmentType, "Garment type", 60);
  const unit = optionalString(body.unit, "Unit", 30);
  if (!garmentType || !unit) {
    throw new ApiError(400, "BAD_REQUEST", "Garment type and unit are required.");
  }
  if (!body.values || typeof body.values !== "object" || Array.isArray(body.values)) {
    throw new ApiError(400, "BAD_REQUEST", "Measurement values are required.");
  }

  const values: Record<string, number> = {};
  for (const [key, value] of Object.entries(body.values)) {
    if (!/^[A-Za-z][A-Za-z0-9_ -]{0,59}$/.test(key)) {
      throw new ApiError(400, "BAD_REQUEST", "A measurement field name is invalid.");
    }
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 1000) {
      throw new ApiError(400, "BAD_REQUEST", `Measurement "${key}" must be a positive number.`);
    }
    values[key] = value;
  }
  if (Object.keys(values).length === 0) {
    throw new ApiError(400, "BAD_REQUEST", "At least one measurement is required.");
  }

  return {
    garmentType,
    unit,
    values,
    notes: optionalString(body.notes, "Measurement notes", 2000),
    height: optionalNumber(body.height, "Height", 1, 300),
    weight: optionalNumber(body.weight, "Weight", 1, 500),
    reason: optionalString(body.reason, "Reason", 500),
  } satisfies MeasurementSet & { reason?: string };
}
