"use server";

// Thin Server Actions only — no business logic here, matching every other actions.ts in this
// codebase. Covers the platform-staff (EduPilot-own-staff, cross-tenant) side of Phase 16,
// Bundle E: Platform Admin's three dashboards' underlying mutations (School Management
// suspend/activate, Plan Catalog CRUD, Billing Run lifecycle). Every action here is gated on
// `platform.billing.manage`, granted to SUPER_ADMIN only (see prisma/seed.ts) — this is
// EduPilot's own cross-tenant action, never a tenant-scoped one, so context is always built as
// PlatformBillingContext ({actingUserId}), never BillingContext ({tenantId, actingUserId}).

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { suspendSchool, activateSchool } from "@/modules/billing/application/school-activation.service";
import {
  createSubscriptionPlanDefinition,
  updateSubscriptionPlanDefinition,
  deactivateSubscriptionPlanDefinition,
} from "@/modules/billing/application/subscription-plan-definition.service";
import {
  createPlanFeatureEntitlement,
  updatePlanFeatureEntitlement,
  deletePlanFeatureEntitlement,
} from "@/modules/billing/application/plan-feature-entitlement.service";
import { createBillingRun, processBillingRun, lockBillingRun } from "@/modules/billing/application/billing-run.service";
import { translateBillingError, type ActionResult } from "./_lib/translate-billing-error";
import type { SubscriptionPlanDefinitionDTO } from "@/modules/billing/application/dto/subscription-plan-definition.dto";
import type { PlanFeatureEntitlementDTO } from "@/modules/billing/application/dto/plan-feature-entitlement.dto";
import type { BillingRunDTO, ProcessBillingRunResultDTO } from "@/modules/billing/application/dto/billing-run.dto";

// --- School Management (suspend/activate) -----------------------------------------------------

export async function suspendSchoolAction(tenantId: string, input: unknown): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("platform.billing.manage");
  try {
    await suspendSchool(tenantId, input, { actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateBillingError(error);
  }
}

export async function activateSchoolAction(tenantId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("platform.billing.manage");
  try {
    await activateSchool(tenantId, { actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateBillingError(error);
  }
}

// --- Plan Catalog: Subscription Plan Definition ------------------------------------------------

export async function createSubscriptionPlanDefinitionAction(
  input: unknown
): Promise<ActionResult<SubscriptionPlanDefinitionDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("platform.billing.manage");
  try {
    const plan = await createSubscriptionPlanDefinition(input, { actingUserId: authContext.userId });
    return { success: true, data: plan };
  } catch (error) {
    return translateBillingError(error);
  }
}

export async function updateSubscriptionPlanDefinitionAction(
  id: string,
  input: unknown
): Promise<ActionResult<SubscriptionPlanDefinitionDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("platform.billing.manage");
  try {
    const plan = await updateSubscriptionPlanDefinition(id, input, { actingUserId: authContext.userId });
    return { success: true, data: plan };
  } catch (error) {
    return translateBillingError(error);
  }
}

export async function deactivateSubscriptionPlanDefinitionAction(
  id: string
): Promise<ActionResult<SubscriptionPlanDefinitionDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("platform.billing.manage");
  try {
    const plan = await deactivateSubscriptionPlanDefinition(id, { actingUserId: authContext.userId });
    return { success: true, data: plan };
  } catch (error) {
    return translateBillingError(error);
  }
}

// --- Plan Catalog: Plan Feature Entitlement ----------------------------------------------------

export async function createPlanFeatureEntitlementAction(
  input: unknown
): Promise<ActionResult<PlanFeatureEntitlementDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("platform.billing.manage");
  try {
    const entitlement = await createPlanFeatureEntitlement(input, { actingUserId: authContext.userId });
    return { success: true, data: entitlement };
  } catch (error) {
    return translateBillingError(error);
  }
}

export async function updatePlanFeatureEntitlementAction(
  id: string,
  input: unknown
): Promise<ActionResult<PlanFeatureEntitlementDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("platform.billing.manage");
  try {
    const entitlement = await updatePlanFeatureEntitlement(id, input, { actingUserId: authContext.userId });
    return { success: true, data: entitlement };
  } catch (error) {
    return translateBillingError(error);
  }
}

export async function deletePlanFeatureEntitlementAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("platform.billing.manage");
  try {
    await deletePlanFeatureEntitlement(id, { actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateBillingError(error);
  }
}

// --- Billing Run ---------------------------------------------------------------------------

export async function createBillingRunAction(input: unknown): Promise<ActionResult<BillingRunDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("platform.billing.manage");
  try {
    const run = await createBillingRun(input, { actingUserId: authContext.userId });
    return { success: true, data: run };
  } catch (error) {
    return translateBillingError(error);
  }
}

export async function processBillingRunAction(billingRunId: string): Promise<ActionResult<ProcessBillingRunResultDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("platform.billing.manage");
  try {
    const result = await processBillingRun(billingRunId, { actingUserId: authContext.userId });
    return { success: true, data: result };
  } catch (error) {
    return translateBillingError(error);
  }
}

export async function lockBillingRunAction(billingRunId: string): Promise<ActionResult<BillingRunDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("platform.billing.manage");
  try {
    const run = await lockBillingRun(billingRunId, { actingUserId: authContext.userId });
    return { success: true, data: run };
  } catch (error) {
    return translateBillingError(error);
  }
}
