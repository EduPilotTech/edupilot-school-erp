import { describe, expect, it } from "vitest";
import { upsertEmployeeBankDetailSchema } from "./employee-bank-detail.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("upsertEmployeeBankDetailSchema", () => {
  it("accepts a valid bank detail", () => {
    const result = upsertEmployeeBankDetailSchema.safeParse({
      employeeId: VALID_UUID,
      accountHolderName: "Jane Doe",
      accountNumber: "1234567890",
      bankName: "State Bank",
      ifscCode: "SBIN0001234",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid IFSC code", () => {
    const result = upsertEmployeeBankDetailSchema.safeParse({
      employeeId: VALID_UUID,
      accountHolderName: "Jane Doe",
      accountNumber: "1234567890",
      bankName: "State Bank",
      ifscCode: "NOT-VALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a blank account number", () => {
    const result = upsertEmployeeBankDetailSchema.safeParse({
      employeeId: VALID_UUID,
      accountHolderName: "Jane Doe",
      accountNumber: "",
      bankName: "State Bank",
      ifscCode: "SBIN0001234",
    });
    expect(result.success).toBe(false);
  });
});
