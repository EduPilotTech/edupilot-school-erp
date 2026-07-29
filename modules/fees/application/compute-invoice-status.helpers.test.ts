import { describe, expect, it } from "vitest";
import { computeInvoiceStatus, computeNetPayable } from "./compute-invoice-status.helpers";

describe("computeNetPayable", () => {
  it("sums amount plus fine minus discount", () => {
    expect(computeNetPayable({ amount: 1000, discountAmount: 100, fineAmount: 50 })).toBe(950);
  });
});

describe("computeInvoiceStatus", () => {
  const dueDate = new Date("2026-01-01T00:00:00.000Z");

  it("is PENDING when unpaid and not yet due", () => {
    const status = computeInvoiceStatus({
      amount: 1000,
      discountAmount: 0,
      fineAmount: 0,
      amountPaid: 0,
      dueDate,
      asOfDate: new Date("2025-12-25"),
    });
    expect(status).toBe("PENDING");
  });

  it("is OVERDUE when unpaid and past the due date", () => {
    const status = computeInvoiceStatus({
      amount: 1000,
      discountAmount: 0,
      fineAmount: 0,
      amountPaid: 0,
      dueDate,
      asOfDate: new Date("2026-01-15"),
    });
    expect(status).toBe("OVERDUE");
  });

  it("is PARTIALLY_PAID when a partial payment has been made, even past the due date", () => {
    const status = computeInvoiceStatus({
      amount: 1000,
      discountAmount: 0,
      fineAmount: 0,
      amountPaid: 400,
      dueDate,
      asOfDate: new Date("2026-01-15"),
    });
    expect(status).toBe("PARTIALLY_PAID");
  });

  it("is PAID once amountPaid covers the full net payable, including any fine", () => {
    const status = computeInvoiceStatus({
      amount: 1000,
      discountAmount: 0,
      fineAmount: 100,
      amountPaid: 1100,
      dueDate,
      asOfDate: new Date("2026-01-15"),
    });
    expect(status).toBe("PAID");
  });
});
