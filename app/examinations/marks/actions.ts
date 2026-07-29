"use server";

// Thin Server Actions only — no business logic here, matching app/attendance/actions.ts exactly.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import { StudentNotFoundError } from "@/modules/students/domain/errors";
import { enterMarks } from "@/modules/examinations/application/enter-marks.service";
import { bulkEnterMarks } from "@/modules/examinations/application/bulk-enter-marks.service";
import {
  ExamNotFoundError,
  ExamSubjectNotFoundError,
  InvalidExamStatusError,
  InvalidMarksError,
  MarksEntryNotAuthorizedError,
} from "@/modules/examinations/domain/errors";
import type { MarksEntryDTO } from "@/modules/examinations/application/dto/marks-entry.dto";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Shared by both actions below — never string-matches `error.message`, only `instanceof`
// (docs/CODING_STANDARDS.md §5). Unexpected errors are rethrown, never swallowed.
function translateMarksError(error: unknown): ActionResult<never> {
  if (error instanceof MarksEntryNotAuthorizedError) {
    return { success: false, error: { code: "NOT_AUTHORIZED", message: error.message } };
  }
  if (error instanceof InvalidMarksError) {
    return { success: false, error: { code: "INVALID_MARKS", message: error.message } };
  }
  if (error instanceof InvalidExamStatusError) {
    return { success: false, error: { code: "INVALID_EXAM_STATUS", message: error.message } };
  }
  if (error instanceof ExamSubjectNotFoundError) {
    return { success: false, error: { code: "EXAM_SUBJECT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof ExamNotFoundError) {
    return { success: false, error: { code: "EXAM_NOT_FOUND", message: error.message } };
  }
  if (error instanceof StudentNotFoundError) {
    return { success: false, error: { code: "STUDENT_NOT_FOUND", message: error.message } };
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

export async function enterMarksAction(input: unknown): Promise<ActionResult<MarksEntryDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("marks.entry");

  try {
    const entry = await enterMarks(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: entry };
  } catch (error) {
    return translateMarksError(error);
  }
}

export async function bulkEnterMarksAction(input: unknown): Promise<ActionResult<MarksEntryDTO[]>> {
  const authContext = await requireAuthContext();
  await requirePermission("marks.entry");

  try {
    const entries = await bulkEnterMarks(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: entries };
  } catch (error) {
    return translateMarksError(error);
  }
}
