import { describe, expect, it } from "vitest";
import { createBillingRunSchema } from "./billing-run.dto";

describe("createBillingRunSchema", () => {
  it("accepts a valid YYYY-MM billing period", () => {
    expect(createBillingRunSchema.safeParse({ billingPeriod: "2026-08" }).success).toBe(true);
  });

  it("rejects an out-of-range month", () => {
    expect(createBillingRunSchema.safeParse({ billingPeriod: "2026-13" }).success).toBe(false);
  });

  it("rejects a malformed billing period", () => {
    expect(createBillingRunSchema.safeParse({ billingPeriod: "August 2026" }).success).toBe(false);
  });
});
