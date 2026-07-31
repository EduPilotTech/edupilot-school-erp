import { describe, expect, it } from "vitest";
import { createIncomeSchema, updateIncomeSchema } from "./income.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createIncomeSchema", () => {
  it("accepts a minimal valid income entry", () => {
    const result = createIncomeSchema.safeParse({
      academicSessionId: VALID_UUID,
      incomeCategoryId: VALID_UUID,
      financeAccountId: VALID_UUID,
      amount: 5000,
      date: "2026-04-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a zero amount", () => {
    const result = createIncomeSchema.safeParse({
      academicSessionId: VALID_UUID,
      incomeCategoryId: VALID_UUID,
      financeAccountId: VALID_UUID,
      amount: 0,
      date: "2026-04-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative amount", () => {
    const result = createIncomeSchema.safeParse({
      academicSessionId: VALID_UUID,
      incomeCategoryId: VALID_UUID,
      financeAccountId: VALID_UUID,
      amount: -100,
      date: "2026-04-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing date", () => {
    const result = createIncomeSchema.safeParse({
      academicSessionId: VALID_UUID,
      incomeCategoryId: VALID_UUID,
      financeAccountId: VALID_UUID,
      amount: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed financeAccountId", () => {
    const result = createIncomeSchema.safeParse({
      academicSessionId: VALID_UUID,
      incomeCategoryId: VALID_UUID,
      financeAccountId: "not-a-uuid",
      amount: 100,
      date: "2026-04-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateIncomeSchema", () => {
  it("accepts description explicitly set to null (clearing it)", () => {
    expect(updateIncomeSchema.safeParse({ description: null }).success).toBe(true);
  });

  it("accepts a partial update with only amount", () => {
    expect(updateIncomeSchema.safeParse({ amount: 250 }).success).toBe(true);
  });

  it("rejects a non-positive amount", () => {
    expect(updateIncomeSchema.safeParse({ amount: 0 }).success).toBe(false);
  });
});
