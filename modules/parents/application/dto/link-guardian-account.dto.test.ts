import { describe, expect, it } from "vitest";
import { linkGuardianAccountSchema } from "./link-guardian-account.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("linkGuardianAccountSchema", () => {
  it("accepts a guardianId with no explicit email (falls back to the Guardian's own email)", () => {
    const result = linkGuardianAccountSchema.safeParse({ guardianId: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("accepts an explicit email override", () => {
    const result = linkGuardianAccountSchema.safeParse({
      guardianId: VALID_UUID,
      email: "parent@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = linkGuardianAccountSchema.safeParse({
      guardianId: VALID_UUID,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});
