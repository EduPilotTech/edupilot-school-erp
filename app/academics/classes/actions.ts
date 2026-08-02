"use server";

// Thin Server Actions only — no business logic here, matching app/academics/classrooms/actions.ts.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import { createClass } from "@/modules/academics/application/create-class.service";
import type { ClassDTO } from "@/modules/academics/application/dto/academic-class.dto";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function translateClassError(error: unknown): ActionResult<never> {
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

export async function createClassAction(input: unknown): Promise<ActionResult<ClassDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("class.manage");

  try {
    const classEntity = await createClass(input, {
      tenantId: authContext.tenantId,
      schoolId: authContext.schoolId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: classEntity };
  } catch (error) {
    return translateClassError(error);
  }
}
