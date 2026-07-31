import { describe, expect, it } from "vitest";
import { createPayrollRunSchema } from "./payroll-run.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createPayrollRunSchema", () => {
  it("accepts a valid billing period", () => {
    const result = createPayrollRunSchema.safeParse({ schoolId: VALID_UUID, billingPeriod: "2026-07" });
    expect(result.success).toBe(true);
  });

  it("accepts December as month 12", () => {
    const result = createPayrollRunSchema.safeParse({ schoolId: VALID_UUID, billingPeriod: "2026-12" });
    expect(result.success).toBe(true);
  });

  it("rejects a month of 00", () => {
    const result = createPayrollRunSchema.safeParse({ schoolId: VALID_UUID, billingPeriod: "2026-00" });
    expect(result.success).toBe(false);
  });

  it("rejects a month of 13", () => {
    const result = createPayrollRunSchema.safeParse({ schoolId: VALID_UUID, billingPeriod: "2026-13" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed billing period", () => {
    const result = createPayrollRunSchema.safeParse({ schoolId: VALID_UUID, billingPeriod: "July 2026" });
    expect(result.success).toBe(false);
  });
});
