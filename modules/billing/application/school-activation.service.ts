import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { SchoolStatusUnchangedError } from "../domain/errors";
import { recordPlatformAudit } from "./billing-audit.helpers";
import { suspendSchoolSchema } from "./dto/school-activation.dto";
import type { PlatformBillingContext } from "./billing-context";

// Platform-staff actions on `Tenant.status`/`TenantStatus` — a DIFFERENT, orthogonal field from
// the subscription lifecycle status (`Tenant.subscriptionStatus`, owned by
// subscription-lifecycle.service.ts). Uses PlatformBillingContext, not BillingContext, mirroring
// subscription-plan-definition.service.ts's own use of PlatformBillingContext for the same
// reason: this is a platform-ops action, not a tenant-scoped one, and there is no tenantId to
// scope the *acting* side by (the tenant being suspended is the argument, not the actor's own
// tenant). Reads/writes go through the plain `prisma` client directly (mirrors
// tenant-access-validation.service.ts's own precedent) — Tenant has no tenant_id column to scope
// by in the first place, so withTenantContext does not apply here.

export async function suspendSchool(tenantId: string, input: unknown, context: PlatformBillingContext): Promise<void> {
  const parsed = suspendSchoolSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid suspension request.");
  }
  const data = parsed.data;
  const { actingUserId } = context;

  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  if (tenant.status === "SUSPENDED") {
    throw new SchoolStatusUnchangedError("This school is already suspended.");
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: "SUSPENDED", updatedBy: actingUserId },
  });

  await recordPlatformAudit({
    tenantId,
    actorId: actingUserId,
    action: "SCHOOL_SUSPENDED",
    entityType: "Tenant",
    entityId: tenantId,
    beforeState: { status: tenant.status },
    afterState: { status: "SUSPENDED", reason: data.reason },
  });
}

export async function activateSchool(tenantId: string, context: PlatformBillingContext): Promise<void> {
  const { actingUserId } = context;

  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  if (tenant.status === "ACTIVE") {
    throw new SchoolStatusUnchangedError("This school is already active.");
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: "ACTIVE", updatedBy: actingUserId },
  });

  await recordPlatformAudit({
    tenantId,
    actorId: actingUserId,
    action: "SCHOOL_ACTIVATED",
    entityType: "Tenant",
    entityId: tenantId,
    beforeState: { status: tenant.status },
    afterState: { status: "ACTIVE" },
  });
}
