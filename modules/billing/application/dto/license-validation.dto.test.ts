import { describe, expect, it } from "vitest";
import { validateLicenseSchema } from "./license-validation.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("validateLicenseSchema", () => {
  it("accepts a valid tenant id", () => {
    expect(validateLicenseSchema.safeParse({ tenantId: VALID_UUID }).success).toBe(true);
  });

  it("rejects a non-uuid tenant id", () => {
    expect(validateLicenseSchema.safeParse({ tenantId: "not-a-uuid" }).success).toBe(false);
  });
});
