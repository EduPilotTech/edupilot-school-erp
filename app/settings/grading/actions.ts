"use server";

// Thin Server Actions only — no business logic here, matching app/attendance/actions.ts exactly.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import { InvalidAcademicSessionError } from "@/modules/students/domain/errors";
import { setGradeScale } from "@/modules/examinations/application/set-grade-scale.service";
import type { GradeScaleDTO } from "@/modules/examinations/application/dto/grade-scale.dto";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function translateGradeScaleError(error: unknown): ActionResult<never> {
  if (error instanceof InvalidAcademicSessionError) {
    return { success: false, error: { code: "INVALID_ACADEMIC_SESSION", message: error.message } };
  }
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

export async function setGradeScaleAction(input: unknown): Promise<ActionResult<GradeScaleDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("grade.manage");

  try {
    const scale = await setGradeScale(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: scale };
  } catch (error) {
    return translateGradeScaleError(error);
  }
}
