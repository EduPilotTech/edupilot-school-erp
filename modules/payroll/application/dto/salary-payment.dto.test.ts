import { describe, expect, it } from "vitest";
import { recordSalaryPaymentSchema, reverseSalaryPaymentSchema } from "./salary-payment.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("recordSalaryPaymentSchema", () => {
  it("accepts a valid payment", () => {
    const result = recordSalaryPaymentSchema.safeParse({
      payslipId: VALID_UUID,
      amount: 25000,
      paymentMode: "BANK_TRANSFER",
      paymentDate: "2026-08-01",
      referenceNumber: "TXN12345",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a payment without a reference number", () => {
    const result = recordSalaryPaymentSchema.safeParse({
      payslipId: VALID_UUID,
      amount: 25000,
      paymentMode: "CASH",
      paymentDate: "2026-08-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive amount", () => {
    const result = recordSalaryPaymentSchema.safeParse({
      payslipId: VALID_UUID,
      amount: 0,
      paymentMode: "CASH",
      paymentDate: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid paymentMode", () => {
    const result = recordSalaryPaymentSchema.safeParse({
      payslipId: VALID_UUID,
      amount: 25000,
      paymentMode: "CRYPTO",
      paymentDate: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("reverseSalaryPaymentSchema", () => {
  it("accepts a valid reversal", () => {
    const result = reverseSalaryPaymentSchema.safeParse({ paymentId: VALID_UUID, reason: "Bank transfer failed" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing reason", () => {
    const result = reverseSalaryPaymentSchema.safeParse({ paymentId: VALID_UUID, reason: "" });
    expect(result.success).toBe(false);
  });
});
