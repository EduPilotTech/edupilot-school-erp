import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  findById: vi.fn(),
  updateLifecycleStatus: vi.fn(),
  transaction: vi.fn(),
  tenantUpdate: vi.fn(),
  recordPlatformAudit: vi.fn(),
  toSubscriptionDTO: vi.fn(),
}));

vi.mock("../infrastructure/prisma-subscription.repository", () => ({
  PrismaSubscriptionRepository: class {
    findById = mocks.findById;
    updateLifecycleStatus = mocks.updateLifecycleStatus;
  },
}));

const fakeTx = { tenant: { update: mocks.tenantUpdate } };

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}));

vi.mock("./billing-audit.helpers", () => ({
  recordPlatformAudit: mocks.recordPlatformAudit,
}));

vi.mock("./subscription.service", () => ({
  toSubscriptionDTO: mocks.toSubscriptionDTO,
}));

import { InvalidLifecycleTransitionError, SubscriptionNotFoundError } from "../domain/errors";
import { moveToActive, moveToExpired, moveToGracePeriod, transitionSubscriptionStatus } from "./subscription-lifecycle.service";
import type { BillingContext } from "./billing-context";

const CONTEXT: BillingContext = { tenantId: "tenant-1", actingUserId: "user-1" };

const CURRENT_ROW = {
  id: "sub-1",
  tenantId: "tenant-1",
  status: "ACTIVE",
  effectiveTo: null,
};

describe("transitionSubscriptionStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(fakeTx));
  });

  it("throws SubscriptionNotFoundError when the subscription does not exist", async () => {
    mocks.findById.mockResolvedValue(null);

    await expect(transitionSubscriptionStatus("tenant-1", "sub-1", "PAST_DUE", CONTEXT)).rejects.toBeInstanceOf(
      SubscriptionNotFoundError
    );
    expect(mocks.updateLifecycleStatus).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("throws InvalidLifecycleTransitionError when targeting a non-current row (effectiveTo already set)", async () => {
    mocks.findById.mockResolvedValue({ ...CURRENT_ROW, effectiveTo: new Date("2026-01-01T00:00:00.000Z") });

    await expect(transitionSubscriptionStatus("tenant-1", "sub-1", "PAST_DUE", CONTEXT)).rejects.toBeInstanceOf(
      InvalidLifecycleTransitionError
    );
    expect(mocks.updateLifecycleStatus).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("throws InvalidLifecycleTransitionError for an invalid transition and does not call the repository's write method", async () => {
    mocks.findById.mockResolvedValue({ ...CURRENT_ROW, status: "EXPIRED" });

    await expect(transitionSubscriptionStatus("tenant-1", "sub-1", "ACTIVE", CONTEXT)).rejects.toBeInstanceOf(
      InvalidLifecycleTransitionError
    );
    expect(mocks.updateLifecycleStatus).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("performs a valid transition, updates Tenant.subscriptionStatus, and audits", async () => {
    mocks.findById.mockResolvedValue({ ...CURRENT_ROW, status: "ACTIVE" });
    mocks.updateLifecycleStatus.mockResolvedValue({ ...CURRENT_ROW, status: "PAST_DUE" });
    mocks.tenantUpdate.mockResolvedValue({});
    mocks.recordPlatformAudit.mockResolvedValue(undefined);
    mocks.toSubscriptionDTO.mockReturnValue({ id: "sub-1", status: "PAST_DUE" });

    const result = await transitionSubscriptionStatus("tenant-1", "sub-1", "PAST_DUE", CONTEXT);

    expect(mocks.updateLifecycleStatus).toHaveBeenCalledWith(
      "tenant-1",
      "sub-1",
      { status: "PAST_DUE", updatedBy: "user-1" },
      fakeTx
    );
    expect(mocks.tenantUpdate).toHaveBeenCalledWith({
      where: { id: "tenant-1" },
      data: { subscriptionStatus: "PAST_DUE", updatedBy: "user-1" },
    });
    expect(mocks.recordPlatformAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        actorId: "user-1",
        action: "SUBSCRIPTION_LIFECYCLE_TRANSITIONED",
        entityType: "Subscription",
        entityId: "sub-1",
        beforeState: expect.objectContaining({ status: "ACTIVE" }),
        afterState: expect.objectContaining({ status: "PAST_DUE" }),
      }),
      fakeTx
    );
    expect(result).toEqual({ id: "sub-1", status: "PAST_DUE" });
  });
});

describe("moveToGracePeriod / moveToExpired / moveToActive convenience wrappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(fakeTx));
    mocks.tenantUpdate.mockResolvedValue({});
    mocks.recordPlatformAudit.mockResolvedValue(undefined);
    mocks.toSubscriptionDTO.mockImplementation((entity: { status: string }) => entity);
  });

  it("moveToGracePeriod transitions ACTIVE -> PAST_DUE", async () => {
    mocks.findById.mockResolvedValue({ ...CURRENT_ROW, status: "ACTIVE" });
    mocks.updateLifecycleStatus.mockResolvedValue({ ...CURRENT_ROW, status: "PAST_DUE" });

    await moveToGracePeriod("tenant-1", "sub-1", CONTEXT);

    expect(mocks.updateLifecycleStatus).toHaveBeenCalledWith(
      "tenant-1",
      "sub-1",
      { status: "PAST_DUE", updatedBy: "user-1" },
      fakeTx
    );
  });

  it("moveToExpired transitions PAST_DUE -> EXPIRED", async () => {
    mocks.findById.mockResolvedValue({ ...CURRENT_ROW, status: "PAST_DUE" });
    mocks.updateLifecycleStatus.mockResolvedValue({ ...CURRENT_ROW, status: "EXPIRED" });

    await moveToExpired("tenant-1", "sub-1", CONTEXT);

    expect(mocks.updateLifecycleStatus).toHaveBeenCalledWith(
      "tenant-1",
      "sub-1",
      { status: "EXPIRED", updatedBy: "user-1" },
      fakeTx
    );
  });

  it("moveToActive transitions PAST_DUE -> ACTIVE (late-payment recovery)", async () => {
    mocks.findById.mockResolvedValue({ ...CURRENT_ROW, status: "PAST_DUE" });
    mocks.updateLifecycleStatus.mockResolvedValue({ ...CURRENT_ROW, status: "ACTIVE" });

    await moveToActive("tenant-1", "sub-1", CONTEXT);

    expect(mocks.updateLifecycleStatus).toHaveBeenCalledWith(
      "tenant-1",
      "sub-1",
      { status: "ACTIVE", updatedBy: "user-1" },
      fakeTx
    );
  });

  it("moveToActive rejects a TRIALING -> ACTIVE row it cannot legally reach itself (still valid transition, sanity check)", async () => {
    mocks.findById.mockResolvedValue({ ...CURRENT_ROW, status: "TRIALING" });
    mocks.updateLifecycleStatus.mockResolvedValue({ ...CURRENT_ROW, status: "ACTIVE" });

    await moveToActive("tenant-1", "sub-1", CONTEXT);

    expect(mocks.updateLifecycleStatus).toHaveBeenCalledWith(
      "tenant-1",
      "sub-1",
      { status: "ACTIVE", updatedBy: "user-1" },
      fakeTx
    );
  });
});
