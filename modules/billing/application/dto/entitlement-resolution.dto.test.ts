import { describe, expect, it } from "vitest";
import { resolveEntitlementSchema } from "./entitlement-resolution.dto";

describe("resolveEntitlementSchema", () => {
  it("accepts a valid feature key", () => {
    expect(resolveEntitlementSchema.safeParse({ featureKey: "transport_module" }).success).toBe(true);
  });

  it("rejects an empty feature key", () => {
    expect(resolveEntitlementSchema.safeParse({ featureKey: "" }).success).toBe(false);
  });

  it("rejects a missing feature key", () => {
    expect(resolveEntitlementSchema.safeParse({}).success).toBe(false);
  });
});
