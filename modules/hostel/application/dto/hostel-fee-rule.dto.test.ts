import { describe, expect, it } from "vitest";
import {
  createHostelFeeRuleSchema,
  generateHostelMonthlyInvoicesSchema,
  generateHostelOneTimeInvoiceSchema,
} from "./hostel-fee-rule.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createHostelFeeRuleSchema", () => {
  it("accepts a valid MONTHLY rule", () => {
    const result = createHostelFeeRuleSchema.safeParse({
      hostelId: VALID_UUID,
      roomType: "DOUBLE",
      academicSessionId: VALID_UUID,
      feeCategoryId: VALID_UUID,
      amount: 5000,
      frequency: "MONTHLY",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a zero or negative amount", () => {
    const result = createHostelFeeRuleSchema.safeParse({
      hostelId: VALID_UUID,
      roomType: "DOUBLE",
      academicSessionId: VALID_UUID,
      feeCategoryId: VALID_UUID,
      amount: 0,
      frequency: "MONTHLY",
    });
    expect(result.success).toBe(false);
  });
});

describe("generateHostelMonthlyInvoicesSchema", () => {
  it("accepts a well-formed billing period", () => {
    expect(
      generateHostelMonthlyInvoicesSchema.safeParse({ academicSessionId: VALID_UUID, billingPeriod: "2026-08" }).success
    ).toBe(true);
  });

  it("rejects a malformed billing period", () => {
    expect(
      generateHostelMonthlyInvoicesSchema.safeParse({ academicSessionId: VALID_UUID, billingPeriod: "Aug-2026" }).success
    ).toBe(false);
  });
});

describe("generateHostelOneTimeInvoiceSchema", () => {
  it("requires both studentId and hostelFeeRuleId", () => {
    expect(generateHostelOneTimeInvoiceSchema.safeParse({ studentId: VALID_UUID }).success).toBe(false);
    expect(
      generateHostelOneTimeInvoiceSchema.safeParse({ studentId: VALID_UUID, hostelFeeRuleId: VALID_UUID }).success
    ).toBe(true);
  });
});
