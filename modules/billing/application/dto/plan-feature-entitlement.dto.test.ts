import { describe, expect, it } from "vitest";
import { createPlanFeatureEntitlementSchema, updatePlanFeatureEntitlementSchema } from "./plan-feature-entitlement.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createPlanFeatureEntitlementSchema", () => {
  it("accepts a valid BOOLEAN entitlement", () => {
    const result = createPlanFeatureEntitlementSchema.safeParse({
      subscriptionPlanDefinitionId: VALID_UUID,
      featureKey: "transport_module",
      valueType: "BOOLEAN",
      booleanValue: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid LIMIT entitlement", () => {
    const result = createPlanFeatureEntitlementSchema.safeParse({
      subscriptionPlanDefinitionId: VALID_UUID,
      featureKey: "max_students",
      valueType: "LIMIT",
      limitValue: 500,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a BOOLEAN entitlement missing booleanValue", () => {
    const result = createPlanFeatureEntitlementSchema.safeParse({
      subscriptionPlanDefinitionId: VALID_UUID,
      featureKey: "transport_module",
      valueType: "BOOLEAN",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a LIMIT entitlement missing limitValue", () => {
    const result = createPlanFeatureEntitlementSchema.safeParse({
      subscriptionPlanDefinitionId: VALID_UUID,
      featureKey: "max_students",
      valueType: "LIMIT",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative limit value", () => {
    const result = createPlanFeatureEntitlementSchema.safeParse({
      subscriptionPlanDefinitionId: VALID_UUID,
      featureKey: "max_students",
      valueType: "LIMIT",
      limitValue: -5,
    });
    expect(result.success).toBe(false);
  });
});

describe("updatePlanFeatureEntitlementSchema", () => {
  it("accepts an empty update", () => {
    expect(updatePlanFeatureEntitlementSchema.safeParse({}).success).toBe(true);
  });

  it("accepts updating just the limit", () => {
    expect(updatePlanFeatureEntitlementSchema.safeParse({ limitValue: 1000 }).success).toBe(true);
  });
});
