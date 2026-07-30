import { describe, expect, it } from "vitest";
import { createHostelSchema, updateHostelSchema } from "./hostel.dto";

describe("createHostelSchema", () => {
  it("accepts a minimal valid payload", () => {
    const result = createHostelSchema.safeParse({
      name: "Boys Hostel A",
      code: "BH-A",
      type: "BOYS",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a blank name", () => {
    const result = createHostelSchema.safeParse({
      name: "",
      code: "BH-A",
      type: "BOYS",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid type", () => {
    const result = createHostelSchema.safeParse({
      name: "Boys Hostel A",
      code: "BH-A",
      type: "MIXED",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateHostelSchema", () => {
  it("accepts an empty payload (all fields optional)", () => {
    expect(updateHostelSchema.safeParse({}).success).toBe(true);
  });

  it("accepts address explicitly set to null", () => {
    const result = updateHostelSchema.safeParse({ address: null });
    expect(result.success).toBe(true);
  });
});
