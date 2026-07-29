"use server";

// Thin Server Action only — no business logic here, matching app/students/new/actions.ts and
// app/settings/users/actions.ts. Resolves the caller's AuthContext, checks the one permission
// this action requires, validates with the same Zod schema the client form uses, delegates to
// update-student-profile.service.ts, and translates thrown domain errors into a typed
// ActionResult.
//
// `student.update` is not yet backed by a real Permission/RolePermission row — same "code exists
// in code before it's seeded" pattern every other module in this codebase follows (see
// app/students/new/actions.ts's `student.admit`).

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { ValidationError } from "@/lib/errors";
import { updateStudentProfile } from "@/modules/students/application/update-student-profile.service";
import {
  updateStudentProfileSchema,
  type UpdateStudentProfileResult,
} from "@/modules/students/application/dto/update-student-profile.dto";
import { GuardianRequiredError, StudentNotFoundError } from "@/modules/students/domain/errors";
import type { EditStudentFormValues } from "./_components/edit-student-form.schema";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Takes the client form's shape (`dateOfBirth` as a string) directly — `updateStudentProfileSchema
// .safeParse()` below accepts `unknown` regardless of its own inferred type, and its
// `z.coerce.date()` handles the string -> Date conversion, so no manual reshape function is
// needed (the field structure already matches 1:1 — this form collects nothing extra).
export async function updateStudentProfileAction(
  values: EditStudentFormValues
): Promise<ActionResult<UpdateStudentProfileResult>> {
  const authContext = await requireAuthContext();
  await requirePermission("student.update");

  const parsed = updateStudentProfileSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "The edit form contains invalid data.",
      },
    };
  }

  try {
    const result = await updateStudentProfile(parsed.data, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof StudentNotFoundError) {
      return { success: false, error: { code: "STUDENT_NOT_FOUND", message: error.message } };
    }
    if (error instanceof GuardianRequiredError) {
      return { success: false, error: { code: "GUARDIAN_REQUIRED", message: error.message } };
    }
    if (error instanceof ValidationError) {
      return { success: false, error: { code: "VALIDATION_ERROR", message: error.message } };
    }

    // Unexpected — never swallowed silently (docs/CODING_STANDARDS.md §5): let it surface.
    throw error;
  }
}
