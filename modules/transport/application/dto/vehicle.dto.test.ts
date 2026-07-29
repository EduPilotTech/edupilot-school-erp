import { describe, expect, it } from "vitest";
import { createVehicleSchema } from "./vehicle.dto";

describe("createVehicleSchema", () => {
  it("accepts a minimal valid payload", () => {
    const result = createVehicleSchema.safeParse({
      registrationNumber: "KA-01-AB-1234",
      vehicleType: "BUS",
      seatingCapacity: 40,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a blank registration number", () => {
    const result = createVehicleSchema.safeParse({
      registrationNumber: "",
      vehicleType: "BUS",
      seatingCapacity: 40,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a seating capacity below 1", () => {
    const result = createVehicleSchema.safeParse({
      registrationNumber: "KA-01-AB-1234",
      vehicleType: "VAN",
      seatingCapacity: 0,
    });
    expect(result.success).toBe(false);
  });
});
