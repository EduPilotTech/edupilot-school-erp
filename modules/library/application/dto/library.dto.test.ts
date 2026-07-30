import { describe, expect, it } from "vitest";
import { createLibrarySchema, updateLibrarySchema, upsertLibrarySettingsSchema } from "./library.dto";

describe("createLibrarySchema", () => {
  it("accepts a minimal valid payload", () => {
    const result = createLibrarySchema.safeParse({ name: "Main Library", code: "LIB-01" });
    expect(result.success).toBe(true);
  });

  it("rejects a blank name", () => {
    const result = createLibrarySchema.safeParse({ name: "", code: "LIB-01" });
    expect(result.success).toBe(false);
  });
});

describe("updateLibrarySchema", () => {
  it("accepts an empty payload (all fields optional)", () => {
    expect(updateLibrarySchema.safeParse({}).success).toBe(true);
  });

  it("accepts address explicitly set to null", () => {
    expect(updateLibrarySchema.safeParse({ address: null }).success).toBe(true);
  });
});

describe("upsertLibrarySettingsSchema", () => {
  it("fills in defaults when nothing is supplied", () => {
    const result = upsertLibrarySettingsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.defaultLoanPeriodDays).toBe(14);
      expect(result.data.maxBooksStudent).toBe(3);
    }
  });

  it("rejects a negative max renewal count", () => {
    const result = upsertLibrarySettingsSchema.safeParse({ maxRenewalCount: -1 });
    expect(result.success).toBe(false);
  });
});
