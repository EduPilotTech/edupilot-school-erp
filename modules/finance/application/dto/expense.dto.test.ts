import { describe, expect, it } from "vitest";
import { createExpenseSchema, updateExpenseSchema } from "./expense.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createExpenseSchema", () => {
  it("accepts a minimal valid expense entry", () => {
    const result = createExpenseSchema.safeParse({
      academicSessionId: VALID_UUID,
      expenseCategoryId: VALID_UUID,
      financeAccountId: VALID_UUID,
      amount: 1200,
      date: "2026-04-01",
      paymentMode: "CASH",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an optional vendor", () => {
    const result = createExpenseSchema.safeParse({
      academicSessionId: VALID_UUID,
      expenseCategoryId: VALID_UUID,
      financeAccountId: VALID_UUID,
      amount: 1200,
      date: "2026-04-01",
      paymentMode: "CHEQUE",
      vendor: "Acme Stationery",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid paymentMode", () => {
    const result = createExpenseSchema.safeParse({
      academicSessionId: VALID_UUID,
      expenseCategoryId: VALID_UUID,
      financeAccountId: VALID_UUID,
      amount: 1200,
      date: "2026-04-01",
      paymentMode: "CRYPTO",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing paymentMode", () => {
    const result = createExpenseSchema.safeParse({
      academicSessionId: VALID_UUID,
      expenseCategoryId: VALID_UUID,
      financeAccountId: VALID_UUID,
      amount: 1200,
      date: "2026-04-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    const result = createExpenseSchema.safeParse({
      academicSessionId: VALID_UUID,
      expenseCategoryId: VALID_UUID,
      financeAccountId: VALID_UUID,
      amount: -5,
      date: "2026-04-01",
      paymentMode: "CASH",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateExpenseSchema", () => {
  it("accepts vendor explicitly set to null (clearing it)", () => {
    expect(updateExpenseSchema.safeParse({ vendor: null }).success).toBe(true);
  });

  it("accepts a partial update with only paymentMode", () => {
    expect(updateExpenseSchema.safeParse({ paymentMode: "UPI" }).success).toBe(true);
  });
});
