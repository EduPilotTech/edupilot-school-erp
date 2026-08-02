import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  validateTenantAccess: vi.fn(),
  resolveEntitlement: vi.fn(),
  requireFeatureEntitlement: vi.fn(),
}));

vi.mock("./tenant-access-validation.service", () => ({
  validateTenantAccess: mocks.validateTenantAccess,
}));

vi.mock("./feature-entitlement.service", () => ({
  resolveEntitlement: mocks.resolveEntitlement,
  requireFeatureEntitlement: mocks.requireFeatureEntitlement,
}));

import { LicenseInvalidError, SchoolSuspendedError } from "../domain/errors";
import { requireFeatureUnlocked, resolveFeatureLock } from "./feature-lock.service";

describe("resolveFeatureLock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("locks and never checks entitlement when tenant access is invalid", async () => {
    mocks.validateTenantAccess.mockResolvedValue({
      valid: false,
      reason: "This subscription has expired.",
      subscriptionStatus: "EXPIRED",
      schoolSuspended: false,
    });

    const result = await resolveFeatureLock("tenant-1", "reports.advanced");

    expect(result).toEqual({ locked: true, reason: "This subscription has expired.", allowed: false, limit: null });
    expect(mocks.resolveEntitlement).not.toHaveBeenCalled();
  });

  it("locks a valid tenant with a BOOLEAN entitlement resolved as not allowed", async () => {
    mocks.validateTenantAccess.mockResolvedValue({ valid: true, reason: null, subscriptionStatus: "ACTIVE", schoolSuspended: false });
    mocks.resolveEntitlement.mockResolvedValue({ featureKey: "reports.advanced", allowed: false, limit: null });

    const result = await resolveFeatureLock("tenant-1", "reports.advanced");

    expect(result).toEqual({ locked: true, reason: null, allowed: false, limit: null });
  });

  it("unlocks a valid tenant with a LIMIT entitlement and passes the limit through", async () => {
    mocks.validateTenantAccess.mockResolvedValue({ valid: true, reason: null, subscriptionStatus: "ACTIVE", schoolSuspended: false });
    mocks.resolveEntitlement.mockResolvedValue({ featureKey: "students.max", allowed: true, limit: 500 });

    const result = await resolveFeatureLock("tenant-1", "students.max");

    expect(result).toEqual({ locked: false, reason: null, allowed: true, limit: 500 });
  });
});

describe("requireFeatureUnlocked", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws SchoolSuspendedError when the tenant is suspended, without checking entitlement", async () => {
    mocks.validateTenantAccess.mockResolvedValue({
      valid: false,
      reason: "This school's account has been suspended. Contact support to reactivate.",
      subscriptionStatus: "ACTIVE",
      schoolSuspended: true,
    });

    await expect(requireFeatureUnlocked("tenant-1", "reports.advanced")).rejects.toBeInstanceOf(SchoolSuspendedError);
    expect(mocks.requireFeatureEntitlement).not.toHaveBeenCalled();
  });

  it("throws LicenseInvalidError when the license is invalid but the tenant is not suspended", async () => {
    mocks.validateTenantAccess.mockResolvedValue({
      valid: false,
      reason: "This subscription has expired.",
      subscriptionStatus: "EXPIRED",
      schoolSuspended: false,
    });

    await expect(requireFeatureUnlocked("tenant-1", "reports.advanced")).rejects.toBeInstanceOf(LicenseInvalidError);
    expect(mocks.requireFeatureEntitlement).not.toHaveBeenCalled();
  });

  it("delegates to requireFeatureEntitlement (which may throw FeatureNotEntitledError) when tenant access is valid", async () => {
    mocks.validateTenantAccess.mockResolvedValue({ valid: true, reason: null, subscriptionStatus: "ACTIVE", schoolSuspended: false });
    mocks.requireFeatureEntitlement.mockResolvedValue(undefined);

    await requireFeatureUnlocked("tenant-1", "reports.advanced");

    expect(mocks.requireFeatureEntitlement).toHaveBeenCalledWith("tenant-1", "reports.advanced");
  });
});
