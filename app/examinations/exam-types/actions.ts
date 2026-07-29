"use server";

// Thin Server Actions only — no business logic here, matching app/attendance/actions.ts exactly.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import { createExamType } from "@/modules/examinations/application/create-exam-type.service";
import { updateExamType, deleteExamType } from "@/modules/examinations/application/update-exam-type.service";
import type { ExamTypeDTO } from "@/modules/examinations/application/dto/exam-type.dto";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function translateExamTypeError(error: unknown): ActionResult<never> {
  if (error instanceof NotFoundError) {
    return { success: false, error: { code: "NOT_FOUND", message: error.message } };
  }
  if (error instanceof BusinessRuleError) {
    return { success: false, error: { code: "BUSINESS_RULE_VIOLATION", message: error.message } };
  }
  if (error instanceof ValidationError) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: error.message } };
  }
  throw error;
}

export async function createExamTypeAction(input: unknown): Promise<ActionResult<ExamTypeDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("examtype.manage");

  try {
    const examType = await createExamType(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: examType };
  } catch (error) {
    return translateExamTypeError(error);
  }
}

export async function updateExamTypeAction(
  examTypeId: string,
  input: unknown
): Promise<ActionResult<ExamTypeDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("examtype.manage");

  try {
    const examType = await updateExamType(examTypeId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: examType };
  } catch (error) {
    return translateExamTypeError(error);
  }
}

export async function deleteExamTypeAction(examTypeId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("examtype.manage");

  try {
    await deleteExamType(examTypeId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateExamTypeError(error);
  }
}
