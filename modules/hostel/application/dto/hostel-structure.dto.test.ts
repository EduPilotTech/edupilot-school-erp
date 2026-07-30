import { describe, expect, it } from "vitest";
import { createHostelRoomSchema, updateHostelRoomSchema, createHostelBedSchema } from "./hostel-structure.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createHostelRoomSchema", () => {
  it("accepts a valid room without a wing (wing is optional)", () => {
    const result = createHostelRoomSchema.safeParse({
      floorId: VALID_UUID,
      roomNumber: "101",
      roomType: "DOUBLE",
      capacity: 2,
      gender: "BOYS",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a capacity below 1", () => {
    const result = createHostelRoomSchema.safeParse({
      floorId: VALID_UUID,
      roomNumber: "101",
      roomType: "DOUBLE",
      capacity: 0,
      gender: "BOYS",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid roomType", () => {
    const result = createHostelRoomSchema.safeParse({
      floorId: VALID_UUID,
      roomNumber: "101",
      roomType: "SUITE",
      capacity: 2,
      gender: "BOYS",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateHostelRoomSchema", () => {
  it("accepts wingId explicitly set to null (detaching from a wing)", () => {
    const result = updateHostelRoomSchema.safeParse({ wingId: null });
    expect(result.success).toBe(true);
  });

  it("accepts a status transition to MAINTENANCE", () => {
    const result = updateHostelRoomSchema.safeParse({ status: "MAINTENANCE" });
    expect(result.success).toBe(true);
  });
});

describe("createHostelBedSchema", () => {
  it("rejects a blank bed number", () => {
    const result = createHostelBedSchema.safeParse({ roomId: VALID_UUID, bedNumber: "" });
    expect(result.success).toBe(false);
  });
});
