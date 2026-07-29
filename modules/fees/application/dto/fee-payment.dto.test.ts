import { describe, expect, it } from "vitest";
import { collectPaymentSchema } from "./fee-payment.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("collectPaymentSchema", () => {
  it("accepts a valid single-invoice payment", () => {
    const result = collectPaymentSchema.safeParse({
      studentId: VALID_UUID,
      academicSessionId: VALID_UUID,
      clientRequestId: VALID_UUID,
      paymentMode: "CASH",
      allocations: [{ invoiceId: VALID_UUID, amount: 500 }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts allocations across multiple invoices", () => {
    const result = collectPaymentSchema.safeParse({
      studentId: VALID_UUID,
      academicSessionId: VALID_UUID,
      clientRequestId: VALID_UUID,
      paymentMode: "UPI",
      allocations: [
        { invoiceId: VALID_UUID, amount: 300 },
        { invoiceId: VALID_UUID, amount: 200 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a payment with no invoices selected", () => {
    const result = collectPaymentSchema.safeParse({
      studentId: VALID_UUID,
      academicSessionId: VALID_UUID,
      clientRequestId: VALID_UUID,
      paymentMode: "CASH",
      allocations: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive allocation amount", () => {
    const result = collectPaymentSchema.safeParse({
      studentId: VALID_UUID,
      academicSessionId: VALID_UUID,
      clientRequestId: VALID_UUID,
      paymentMode: "CASH",
      allocations: [{ invoiceId: VALID_UUID, amount: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing clientRequestId (the double-payment-prevention idempotency key)", () => {
    const result = collectPaymentSchema.safeParse({
      studentId: VALID_UUID,
      academicSessionId: VALID_UUID,
      paymentMode: "CASH",
      allocations: [{ invoiceId: VALID_UUID, amount: 500 }],
    });
    expect(result.success).toBe(false);
  });
});
