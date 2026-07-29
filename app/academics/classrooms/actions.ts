"use server";

// Thin Server Actions only — no business logic here, matching app/attendance/actions.ts exactly.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import { createClassroom } from "@/modules/academics/application/create-classroom.service";
import { updateClassroom, deleteClassroom } from "@/modules/academics/application/update-classroom.service";
import type { ClassroomDTO } from "@/modules/academics/application/dto/classroom.dto";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function translateClassroomError(error: unknown): ActionResult<never> {
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

export async function createClassroomAction(input: unknown): Promise<ActionResult<ClassroomDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("classroom.manage");

  try {
    const classroom = await createClassroom(input, {
      tenantId: authContext.tenantId,
      schoolId: authContext.schoolId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: classroom };
  } catch (error) {
    return translateClassroomError(error);
  }
}

export async function updateClassroomAction(
  classroomId: string,
  input: unknown
): Promise<ActionResult<ClassroomDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("classroom.manage");

  try {
    const classroom = await updateClassroom(classroomId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: classroom };
  } catch (error) {
    return translateClassroomError(error);
  }
}

export async function deleteClassroomAction(classroomId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("classroom.manage");

  try {
    await deleteClassroom(classroomId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateClassroomError(error);
  }
}
