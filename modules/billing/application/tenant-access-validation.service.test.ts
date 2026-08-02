import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  tenantFindUniqueOrThrow: vi.fn(),
  validateLicense: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tenant: {
      findUniqueOrThrow: mocks.tenantFindUniqueOrThrow,
    },
  },
}));

vi.mock("./license-validation.service", () => ({
  validateLicense: mocks.validateLicense,
}));

import { LicenseInvalidError, SchoolSuspendedError } from "../domain/errors";
import { requireTenantAccess, validateTenantAccess } from "./tenant-access-validation.service";

describe("validateTenantAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("a suspended tenant is invalid with schoolSuspended true, regardless of what the license check would have said", async () => {
    mocks.tenantFindUniqueOrThrow.mockResolvedValue({ id: "tenant-1", status: "SUSPENDED" });
    mocks.validateLicense.mockResolvedValue({ valid: true, status: "ACTIVE", reason: null });

    const result = await validateTenantAccess("tenant-1");

    expect(result).toEqual({
      valid: false,
      reason: "This school's account has been suspended. Contact support to reactivate.",
      subscriptionStatus: "ACTIVE",
      schoolSuspended: true,
    });
    expect(mocks.validateLicense).toHaveBeenCalledWith({ tenantId: "tenant-1" });
  });

  it("a non-suspended tenant with an invalid license is invalid with schoolSuspended false and the license's own reason surfaced", async () => {
    mocks.tenantFindUniqueOrThrow.mockResolvedValue({ id: "tenant-1", status: "ACTIVE" });
    mocks.validateLicense.mockResolvedValue({ valid: false, status: "EXPIRED", reason: "This subscription has expired." });

    const result = await validateTenantAccess("tenant-1");

    expect(result).toEqual({
      valid: false,
      reason: "This subscription has expired.",
      subscriptionStatus: "EXPIRED",
      schoolSuspended: false,
    });
  });

  it("a non-suspended tenant with a valid license is valid", async () => {
    mocks.tenantFindUniqueOrThrow.mockResolvedValue({ id: "tenant-1", status: "ACTIVE" });
    mocks.validateLicense.mockResolvedValue({ valid: true, status: "ACTIVE", reason: null });

    const result = await validateTenantAccess("tenant-1");

    expect(result).toEqual({ valid: true, reason: null, subscriptionStatus: "ACTIVE", schoolSuspended: false });
  });
});

describe("requireTenantAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws SchoolSuspendedError for a suspended tenant", async () => {
    mocks.tenantFindUniqueOrThrow.mockResolvedValue({ id: "tenant-1", status: "SUSPENDED" });
    mocks.validateLicense.mockResolvedValue({ valid: true, status: "ACTIVE", reason: null });

    await expect(requireTenantAccess("tenant-1")).rejects.toBeInstanceOf(SchoolSuspendedError);
  });

  it("throws LicenseInvalidError with the resolved reason for a non-suspended tenant with an invalid license", async () => {
    mocks.tenantFindUniqueOrThrow.mockResolvedValue({ id: "tenant-1", status: "ACTIVE" });
    mocks.validateLicense.mockResolvedValue({ valid: false, status: "CANCELED", reason: "This subscription has been cancelled." });

    await expect(requireTenantAccess("tenant-1")).rejects.toBeInstanceOf(LicenseInvalidError);
    await expect(requireTenantAccess("tenant-1")).rejects.toThrow("This subscription has been cancelled.");
  });

  it("resolves without throwing for a non-suspended tenant with a valid license", async () => {
    mocks.tenantFindUniqueOrThrow.mockResolvedValue({ id: "tenant-1", status: "ACTIVE" });
    mocks.validateLicense.mockResolvedValue({ valid: true, status: "ACTIVE", reason: null });

    await expect(requireTenantAccess("tenant-1")).resolves.toBeUndefined();
  });
});
