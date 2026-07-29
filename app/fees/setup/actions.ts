"use server";

// Thin Server Actions only — no business logic here, matching every other actions.ts in this
// codebase. Covers Fee Categories, Fee Structures, Class-wise Fee Structure Items, Student Fee
// Assignment, Installment Plans, and Fine Rules (Phase 8 requirements 1-4, 7, 12).

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { createFeeCategory } from "@/modules/fees/application/create-fee-category.service";
import { updateFeeCategory, deleteFeeCategory } from "@/modules/fees/application/update-fee-category.service";
import { createFeeStructure } from "@/modules/fees/application/create-fee-structure.service";
import { addFeeStructureItem } from "@/modules/fees/application/add-fee-structure-item.service";
import {
  updateFeeStructureItem,
  deleteFeeStructureItem,
} from "@/modules/fees/application/update-fee-structure-item.service";
import { assignStudentFee } from "@/modules/fees/application/assign-student-fee.service";
import { createInstallmentPlan } from "@/modules/fees/application/create-installment-plan.service";
import { createFineRule } from "@/modules/fees/application/create-fine-rule.service";
import { updateFineRule, deleteFineRule } from "@/modules/fees/application/update-fine-rule.service";
import { translateFeeError, type ActionResult } from "../_lib/translate-fee-error";
import type { FeeCategoryDTO } from "@/modules/fees/application/dto/fee-category.dto";
import type { FeeStructureDTO, FeeStructureItemDTO } from "@/modules/fees/application/dto/fee-structure.dto";
import type { StudentFeeAssignmentDTO } from "@/modules/fees/application/dto/student-fee-assignment.dto";
import type { InstallmentPlanDTO } from "@/modules/fees/application/dto/installment-plan.dto";
import type { FineRuleDTO } from "@/modules/fees/application/dto/fine-rule.dto";

export async function createFeeCategoryAction(input: unknown): Promise<ActionResult<FeeCategoryDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("feecategory.manage");
  try {
    const category = await createFeeCategory(input, {
      tenantId: authContext.tenantId,
      schoolId: authContext.schoolId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: category };
  } catch (error) {
    return translateFeeError(error);
  }
}

export async function updateFeeCategoryAction(
  categoryId: string,
  input: unknown
): Promise<ActionResult<FeeCategoryDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("feecategory.manage");
  try {
    const category = await updateFeeCategory(categoryId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: category };
  } catch (error) {
    return translateFeeError(error);
  }
}

export async function deleteFeeCategoryAction(categoryId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("feecategory.manage");
  try {
    await deleteFeeCategory(categoryId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateFeeError(error);
  }
}

export async function createFeeStructureAction(input: unknown): Promise<ActionResult<FeeStructureDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("feestructure.manage");
  try {
    const structure = await createFeeStructure(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: structure };
  } catch (error) {
    return translateFeeError(error);
  }
}

export async function addFeeStructureItemAction(input: unknown): Promise<ActionResult<FeeStructureItemDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("feestructure.manage");
  try {
    const item = await addFeeStructureItem(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: item };
  } catch (error) {
    return translateFeeError(error);
  }
}

export async function updateFeeStructureItemAction(
  itemId: string,
  input: unknown
): Promise<ActionResult<FeeStructureItemDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("feestructure.manage");
  try {
    const item = await updateFeeStructureItem(itemId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: item };
  } catch (error) {
    return translateFeeError(error);
  }
}

export async function deleteFeeStructureItemAction(itemId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("feestructure.manage");
  try {
    await deleteFeeStructureItem(itemId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateFeeError(error);
  }
}

export async function assignStudentFeeAction(input: unknown): Promise<ActionResult<StudentFeeAssignmentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("feeassignment.manage");
  try {
    const assignment = await assignStudentFee(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: assignment };
  } catch (error) {
    return translateFeeError(error);
  }
}

export async function createInstallmentPlanAction(input: unknown): Promise<ActionResult<InstallmentPlanDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("fee.installmentplan.manage");
  try {
    const plan = await createInstallmentPlan(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: plan };
  } catch (error) {
    return translateFeeError(error);
  }
}

export async function createFineRuleAction(input: unknown): Promise<ActionResult<FineRuleDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("fee.finerule.manage");
  try {
    const rule = await createFineRule(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: rule };
  } catch (error) {
    return translateFeeError(error);
  }
}

export async function updateFineRuleAction(fineRuleId: string, input: unknown): Promise<ActionResult<FineRuleDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("fee.finerule.manage");
  try {
    const rule = await updateFineRule(fineRuleId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: rule };
  } catch (error) {
    return translateFeeError(error);
  }
}

export async function deleteFineRuleAction(fineRuleId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("fee.finerule.manage");
  try {
    await deleteFineRule(fineRuleId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateFeeError(error);
  }
}
