"use server";

// Thin Server Actions only — no business logic here, matching app/attendance/actions.ts exactly.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import { createTeacher } from "@/modules/teachers/application/create-teacher.service";
import { updateTeacher } from "@/modules/teachers/application/update-teacher.service";
import { TeacherAlreadyExistsError, TeacherNotFoundError, TeacherRoleRequiredError } from "@/modules/teachers/domain/errors";
import type { TeacherDTO } from "@/modules/teachers/application/dto/teacher.dto";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function translateTeacherError(error: unknown): ActionResult<never> {
  if (error instanceof TeacherNotFoundError) {
    return { success: false, error: { code: "TEACHER_NOT_FOUND", message: error.message } };
  }
  if (error instanceof TeacherAlreadyExistsError) {
    return { success: false, error: { code: "TEACHER_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof TeacherRoleRequiredError) {
    return { success: false, error: { code: "TEACHER_ROLE_REQUIRED", message: error.message } };
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

export async function createTeacherAction(input: unknown): Promise<ActionResult<TeacherDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("teacher.manage");

  try {
    const teacher = await createTeacher(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: teacher };
  } catch (error) {
    return translateTeacherError(error);
  }
}

export async function updateTeacherAction(
  teacherId: string,
  input: unknown
): Promise<ActionResult<TeacherDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("teacher.manage");

  try {
    const teacher = await updateTeacher(teacherId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: teacher };
  } catch (error) {
    return translateTeacherError(error);
  }
}
