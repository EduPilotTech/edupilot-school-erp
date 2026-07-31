import { describe, expect, it } from "vitest";
import { createFinanceAccountSchema, updateFinanceAccountSchema } from "./finance-account.dto";

describe("createFinanceAccountSchema", () => {
  it("accepts a minimal valid CASH account and defaults openingBalance/isDefault", () => {
    const result = createFinanceAccountSchema.safeParse({ name: "Petty Cash", accountType: "CASH" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.openingBalance).toBe(0);
      expect(result.data.isDefault).toBe(false);
    }
  });

  it("rejects a blank name", () => {
    const result = createFinanceAccountSchema.safeParse({ name: "", accountType: "CASH" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid accountType", () => {
    const result = createFinanceAccountSchema.safeParse({ name: "Main", accountType: "CRYPTO" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative opening balance", () => {
    const result = createFinanceAccountSchema.safeParse({ name: "Main", accountType: "BANK", openingBalance: -100 });
    expect(result.success).toBe(false);
  });
});

describe("updateFinanceAccountSchema", () => {
  it("accepts a partial update with only isActive", () => {
    expect(updateFinanceAccountSchema.safeParse({ isActive: false }).success).toBe(true);
  });

  it("rejects an empty-string name", () => {
    expect(updateFinanceAccountSchema.safeParse({ name: "" }).success).toBe(false);
  });
});
