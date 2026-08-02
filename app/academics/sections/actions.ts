"use server";

// Thin Server Actions only — no business logic here, matching app/academics/classrooms/actions.ts.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import { createSection } from "@/modules/academics/application/create-section.service";
import type { SectionDTO } from "@/modules/academics/application/dto/academic-section.dto";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function translateSectionError(error: unknown): ActionResult<never> {
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

export async function createSectionAction(input: unknown): Promise<ActionResult<SectionDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("section.manage");

  try {
    const section = await createSection(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: section };
  } catch (error) {
    return translateSectionError(error);
  }
}
