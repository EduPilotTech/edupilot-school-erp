"use server";

// Thin Server Actions only — no business logic here, matching app/attendance/actions.ts exactly.
// Reads (report card, progress report, ranking) intentionally have NO Server Actions — they're
// pure reads, called directly from Server Component pages per this codebase's established
// convention.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import { StudentNotEnrolledError } from "@/modules/examinations/domain/errors";
import { generateResult } from "@/modules/examinations/application/generate-result.service";
import { bulkGenerateResults } from "@/modules/examinations/application/bulk-generate-results.service";
import { publishResults, bulkPublishResults } from "@/modules/examinations/application/publish-results.service";
import {
  ExamNotFoundError,
  IncompleteMarksEntryError,
  InvalidExamStatusError,
} from "@/modules/examinations/domain/errors";
import type { ExamResultDTO } from "@/modules/examinations/application/dto/exam-result.dto";
import type { ExamDTO } from "@/modules/examinations/application/dto/exam.dto";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function translateResultError(error: unknown): ActionResult<never> {
  if (error instanceof IncompleteMarksEntryError) {
    return { success: false, error: { code: "INCOMPLETE_MARKS_ENTRY", message: error.message } };
  }
  if (error instanceof StudentNotEnrolledError) {
    return { success: false, error: { code: "STUDENT_NOT_ENROLLED", message: error.message } };
  }
  if (error instanceof InvalidExamStatusError) {
    return { success: false, error: { code: "INVALID_EXAM_STATUS", message: error.message } };
  }
  if (error instanceof ExamNotFoundError) {
    return { success: false, error: { code: "EXAM_NOT_FOUND", message: error.message } };
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

export async function generateResultAction(
  examId: string,
  studentId: string
): Promise<ActionResult<ExamResultDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("result.generate");

  try {
    const result = await generateResult(examId, studentId, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: result };
  } catch (error) {
    return translateResultError(error);
  }
}

export async function bulkGenerateResultsAction(examId: string): Promise<ActionResult<ExamResultDTO[]>> {
  const authContext = await requireAuthContext();
  await requirePermission("result.generate");

  try {
    const results = await bulkGenerateResults(examId, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: results };
  } catch (error) {
    return translateResultError(error);
  }
}

export async function publishResultsAction(examId: string): Promise<ActionResult<ExamDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("result.publish");

  try {
    const exam = await publishResults(examId, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: exam };
  } catch (error) {
    return translateResultError(error);
  }
}

export async function bulkPublishResultsAction(examIds: string[]): Promise<ActionResult<ExamDTO[]>> {
  const authContext = await requireAuthContext();
  await requirePermission("result.publish");

  try {
    const exams = await bulkPublishResults(examIds, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: exams };
  } catch (error) {
    return translateResultError(error);
  }
}
