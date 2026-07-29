"use server";

// Thin Server Actions only — no business logic here, matching app/attendance/actions.ts exactly.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import { createSubject } from "@/modules/academics/application/create-subject.service";
import { updateSubject, deleteSubject } from "@/modules/academics/application/update-subject.service";
import type { SubjectDTO } from "@/modules/academics/application/dto/subject.dto";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function translateSubjectError(error: unknown): ActionResult<never> {
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

export async function createSubjectAction(input: unknown): Promise<ActionResult<SubjectDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("subject.manage");

  try {
    const subject = await createSubject(input, {
      tenantId: authContext.tenantId,
      schoolId: authContext.schoolId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: subject };
  } catch (error) {
    return translateSubjectError(error);
  }
}

export async function updateSubjectAction(
  subjectId: string,
  input: unknown
): Promise<ActionResult<SubjectDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("subject.manage");

  try {
    const subject = await updateSubject(subjectId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: subject };
  } catch (error) {
    return translateSubjectError(error);
  }
}

export async function deleteSubjectAction(subjectId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("subject.manage");

  try {
    await deleteSubject(subjectId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateSubjectError(error);
  }
}
