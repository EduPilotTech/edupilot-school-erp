"use server";

// Thin Server Actions only — no business logic here, matching app/academics/classrooms/actions.ts.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import { createAcademicSession } from "@/modules/academics/application/create-academic-session.service";
import type { AcademicSessionDTO } from "@/modules/academics/application/dto/academic-session.dto";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function translateAcademicSessionError(error: unknown): ActionResult<never> {
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

export async function createAcademicSessionAction(input: unknown): Promise<ActionResult<AcademicSessionDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("academic-session.manage");

  try {
    const session = await createAcademicSession(input, {
      tenantId: authContext.tenantId,
      schoolId: authContext.schoolId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: session };
  } catch (error) {
    return translateAcademicSessionError(error);
  }
}
