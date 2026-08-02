import { describe, expect, it } from "vitest";
import { createSubscriptionPlanDefinitionSchema, updateSubscriptionPlanDefinitionSchema } from "./subscription-plan-definition.dto";

describe("createSubscriptionPlanDefinitionSchema", () => {
  it("accepts a valid plan definition", () => {
    const result = createSubscriptionPlanDefinitionSchema.safeParse({
      planCode: "PRO",
      name: "Pro",
      monthlyPrice: 4999,
      annualPrice: 49990,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown plan code", () => {
    const result = createSubscriptionPlanDefinitionSchema.safeParse({
      planCode: "GOLD",
      name: "Gold",
      monthlyPrice: 4999,
      annualPrice: 49990,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative monthly price", () => {
    const result = createSubscriptionPlanDefinitionSchema.safeParse({
      planCode: "PRO",
      name: "Pro",
      monthlyPrice: -1,
      annualPrice: 49990,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty plan name", () => {
    const result = createSubscriptionPlanDefinitionSchema.safeParse({
      planCode: "PRO",
      name: "",
      monthlyPrice: 4999,
      annualPrice: 49990,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateSubscriptionPlanDefinitionSchema", () => {
  it("accepts a partial update", () => {
    const result = updateSubscriptionPlanDefinitionSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });

  it("accepts an empty update", () => {
    const result = updateSubscriptionPlanDefinitionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects a non-3-letter currency", () => {
    const result = updateSubscriptionPlanDefinitionSchema.safeParse({ currency: "RUPEE" });
    expect(result.success).toBe(false);
  });
});
