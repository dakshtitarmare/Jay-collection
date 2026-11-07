import { describe, expect, it } from "vitest";
import { validateCustomerInput, validateMeasurementInput } from "./customerValidation";

describe("customer validation", () => {
  it("normalizes a formatted mobile number", () => {
    expect(validateCustomerInput({ name: " Rahul ", mobile: "+91 98765-43210" })).toMatchObject({
      name: "Rahul",
      mobile: "+919876543210",
    });
  });

  it("rejects invalid measurements", () => {
    expect(() => validateMeasurementInput({
      garmentType: "shirt",
      unit: "inches",
      values: { chest: 0 },
    })).toThrow("positive number");
  });

  it("accepts extensible measurement keys and body metrics", () => {
    expect(validateMeasurementInput({
      garmentType: "shirt",
      unit: "inches",
      values: { chest: 40, customSleeve: 24 },
      height: 175,
      weight: 72,
    })).toMatchObject({ height: 175, weight: 72, values: { customSleeve: 24 } });
  });
});
