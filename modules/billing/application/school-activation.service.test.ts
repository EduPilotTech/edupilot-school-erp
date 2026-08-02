import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  tenantFindUniqueOrThrow: vi.fn(),
  tenantUpdate: vi.fn(),
  recordPlatformAudit: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tenant: {
      findUniqueOrThrow: mocks.tenantFindUniqueOrThrow,
      update: mocks.tenantUpdate,
    },
  },
}));

vi.mock("./billing-audit.helpers", () => ({
  recordPlatformAudit: mocks.recordPlatformAudit,
}));

import { ValidationError } from "@/lib/errors";
import { SchoolStatusUnchangedError } from "../domain/errors";
import { activateSchool, suspendSchool } from "./school-activation.service";
import type { PlatformBillingContext } from "./billing-context";

const CONTEXT: PlatformBillingContext = { actingUserId: "platform-admin-1" };

describe("suspendSchool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws ValidationError for an empty reason and never loads the tenant", async () => {
    await expect(suspendSchool("tenant-1", { reason: "" }, CONTEXT)).rejects.toBeInstanceOf(ValidationError);
    expect(mocks.tenantFindUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("throws ValidationError when reason is missing entirely", async () => {
    await expect(suspendSchool("tenant-1", {}, CONTEXT)).rejects.toBeInstanceOf(ValidationError);
    expect(mocks.tenantFindUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("suspends an ACTIVE tenant, persists SUSPENDED, and audits", async () => {
    mocks.tenantFindUniqueOrThrow.mockResolvedValue({ id: "tenant-1", status: "ACTIVE" });
    mocks.tenantUpdate.mockResolvedValue({});
    mocks.recordPlatformAudit.mockResolvedValue(undefined);

    await suspendSchool("tenant-1", { reason: "ToS violation" }, CONTEXT);

    expect(mocks.tenantUpdate).toHaveBeenCalledWith({
      where: { id: "tenant-1" },
      data: { status: "SUSPENDED", updatedBy: "platform-admin-1" },
    });
    expect(mocks.recordPlatformAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        actorId: "platform-admin-1",
        action: "SCHOOL_SUSPENDED",
        entityType: "Tenant",
        entityId: "tenant-1",
        afterState: expect.objectContaining({ status: "SUSPENDED", reason: "ToS violation" }),
      })
    );
  });

  it("throws SchoolStatusUnchangedError when the tenant is already suspended and never writes", async () => {
    mocks.tenantFindUniqueOrThrow.mockResolvedValue({ id: "tenant-1", status: "SUSPENDED" });

    await expect(suspendSchool("tenant-1", { reason: "Duplicate" }, CONTEXT)).rejects.toBeInstanceOf(SchoolStatusUnchangedError);
    expect(mocks.tenantUpdate).not.toHaveBeenCalled();
    expect(mocks.recordPlatformAudit).not.toHaveBeenCalled();
  });
});

describe("activateSchool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("activates a SUSPENDED tenant, persists ACTIVE, and audits", async () => {
    mocks.tenantFindUniqueOrThrow.mockResolvedValue({ id: "tenant-1", status: "SUSPENDED" });
    mocks.tenantUpdate.mockResolvedValue({});
    mocks.recordPlatformAudit.mockResolvedValue(undefined);

    await activateSchool("tenant-1", CONTEXT);

    expect(mocks.tenantUpdate).toHaveBeenCalledWith({
      where: { id: "tenant-1" },
      data: { status: "ACTIVE", updatedBy: "platform-admin-1" },
    });
    expect(mocks.recordPlatformAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        actorId: "platform-admin-1",
        action: "SCHOOL_ACTIVATED",
        entityType: "Tenant",
        entityId: "tenant-1",
      })
    );
  });

  it("throws SchoolStatusUnchangedError when the tenant is already active and never writes", async () => {
    mocks.tenantFindUniqueOrThrow.mockResolvedValue({ id: "tenant-1", status: "ACTIVE" });

    await expect(activateSchool("tenant-1", CONTEXT)).rejects.toBeInstanceOf(SchoolStatusUnchangedError);
    expect(mocks.tenantUpdate).not.toHaveBeenCalled();
    expect(mocks.recordPlatformAudit).not.toHaveBeenCalled();
  });
});
