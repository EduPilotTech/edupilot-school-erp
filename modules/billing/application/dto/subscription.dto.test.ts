import { describe, expect, it } from "vitest";
import { cancelSubscriptionSchema, createSubscriptionSchema } from "./subscription.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createSubscriptionSchema", () => {
  it("accepts a valid subscription assignment", () => {
    const result = createSubscriptionSchema.safeParse({
      subscriptionPlanDefinitionId: VALID_UUID,
      billingCycle: "MONTHLY",
      effectiveFrom: "2026-08-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid billing cycle", () => {
    const result = createSubscriptionSchema.safeParse({
      subscriptionPlanDefinitionId: VALID_UUID,
      billingCycle: "WEEKLY",
      effectiveFrom: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing plan id", () => {
    const result = createSubscriptionSchema.safeParse({
      billingCycle: "ANNUAL",
      effectiveFrom: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("cancelSubscriptionSchema", () => {
  it("accepts a valid cancellation reason", () => {
    expect(cancelSubscriptionSchema.safeParse({ reason: "No longer needed." }).success).toBe(true);
  });

  it("rejects an empty reason", () => {
    expect(cancelSubscriptionSchema.safeParse({ reason: "" }).success).toBe(false);
  });
});
