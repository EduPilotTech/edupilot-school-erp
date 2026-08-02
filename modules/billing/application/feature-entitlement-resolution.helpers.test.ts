import { describe, expect, it } from "vitest";
import { resolveFeatureEntitlement } from "./feature-entitlement-resolution.helpers";
import type { PlanFeatureEntitlementEntity } from "../domain/plan-feature-entitlement.entity";

function makeEntitlement(overrides: Partial<PlanFeatureEntitlementEntity>): PlanFeatureEntitlementEntity {
  return {
    id: "ent-1",
    subscriptionPlanDefinitionId: "plan-1",
    featureKey: "transport_module",
    valueType: "BOOLEAN",
    booleanValue: null,
    limitValue: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("resolveFeatureEntitlement", () => {
  it("denies when no entitlement row exists (deny-by-default)", () => {
    expect(resolveFeatureEntitlement(null)).toEqual({ allowed: false, limit: null });
  });

  it("allows a BOOLEAN entitlement with booleanValue true", () => {
    const entitlement = makeEntitlement({ valueType: "BOOLEAN", booleanValue: true });
    expect(resolveFeatureEntitlement(entitlement)).toEqual({ allowed: true, limit: null });
  });

  it("denies a BOOLEAN entitlement with booleanValue false", () => {
    const entitlement = makeEntitlement({ valueType: "BOOLEAN", booleanValue: false });
    expect(resolveFeatureEntitlement(entitlement)).toEqual({ allowed: false, limit: null });
  });

  it("denies a BOOLEAN entitlement with a null booleanValue", () => {
    const entitlement = makeEntitlement({ valueType: "BOOLEAN", booleanValue: null });
    expect(resolveFeatureEntitlement(entitlement)).toEqual({ allowed: false, limit: null });
  });

  it("allows a LIMIT entitlement with a positive limit and returns it", () => {
    const entitlement = makeEntitlement({ valueType: "LIMIT", limitValue: 500 });
    expect(resolveFeatureEntitlement(entitlement)).toEqual({ allowed: true, limit: 500 });
  });

  it("denies a LIMIT entitlement with a zero limit", () => {
    const entitlement = makeEntitlement({ valueType: "LIMIT", limitValue: 0 });
    expect(resolveFeatureEntitlement(entitlement)).toEqual({ allowed: false, limit: 0 });
  });

  it("denies a LIMIT entitlement with a null limitValue, treating it as zero", () => {
    const entitlement = makeEntitlement({ valueType: "LIMIT", limitValue: null });
    expect(resolveFeatureEntitlement(entitlement)).toEqual({ allowed: false, limit: 0 });
  });
});
