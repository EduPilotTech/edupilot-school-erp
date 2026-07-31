import { describe, expect, it } from "vitest";
import { createEmployeeLoanSchema } from "./employee-loan.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createEmployeeLoanSchema", () => {
  it("accepts a valid loan", () => {
    const result = createEmployeeLoanSchema.safeParse({
      employeeId: VALID_UUID,
      loanType: "LOAN",
      principalAmount: 50000,
      monthlyRecoveryAmount: 5000,
      startDate: "2026-08-01",
      reason: "Home renovation",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid advance without a reason", () => {
    const result = createEmployeeLoanSchema.safeParse({
      employeeId: VALID_UUID,
      loanType: "ADVANCE",
      principalAmount: 10000,
      monthlyRecoveryAmount: 2000,
      startDate: "2026-08-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive principalAmount", () => {
    const result = createEmployeeLoanSchema.safeParse({
      employeeId: VALID_UUID,
      loanType: "LOAN",
      principalAmount: 0,
      monthlyRecoveryAmount: 5000,
      startDate: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid loanType", () => {
    const result = createEmployeeLoanSchema.safeParse({
      employeeId: VALID_UUID,
      loanType: "GRANT",
      principalAmount: 50000,
      monthlyRecoveryAmount: 5000,
      startDate: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });
});
