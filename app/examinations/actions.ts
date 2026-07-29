"use server";

// Thin Server Actions only — no business logic here, matching app/attendance/actions.ts exactly.
// Reads (exam/exam-subject lists) intentionally have NO Server Actions — they're pure reads,
// called directly from Server Component pages per this codebase's established convention.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import {
  InvalidAcademicSessionError,
  InvalidClassError,
} from "@/modules/students/domain/errors";
import { SubjectNotFoundError } from "@/modules/academics/domain/errors";
import { createExam } from "@/modules/examinations/application/create-exam.service";
import { updateExamStatus } from "@/modules/examinations/application/update-exam-status.service";
import { addExamSubject } from "@/modules/examinations/application/add-exam-subject.service";
import {
  ExamNotFoundError,
  ExamSubjectAlreadyExistsError,
  ExamTypeNotFoundError,
  GradeScaleNotFoundError,
  InvalidExamStatusError,
} from "@/modules/examinations/domain/errors";
import type { ExamDTO } from "@/modules/examinations/application/dto/exam.dto";
import type { ExamSubjectDTO } from "@/modules/examinations/application/dto/exam-subject.dto";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function translateExamError(error: unknown): ActionResult<never> {
  if (error instanceof InvalidExamStatusError) {
    return { success: false, error: { code: "INVALID_EXAM_STATUS", message: error.message } };
  }
  if (error instanceof ExamSubjectAlreadyExistsError) {
    return { success: false, error: { code: "EXAM_SUBJECT_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof ExamTypeNotFoundError) {
    return { success: false, error: { code: "EXAM_TYPE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof GradeScaleNotFoundError) {
    return { success: false, error: { code: "GRADE_SCALE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof ExamNotFoundError) {
    return { success: false, error: { code: "EXAM_NOT_FOUND", message: error.message } };
  }
  if (error instanceof InvalidAcademicSessionError) {
    return { success: false, error: { code: "INVALID_ACADEMIC_SESSION", message: error.message } };
  }
  if (error instanceof InvalidClassError) {
    return { success: false, error: { code: "INVALID_CLASS", message: error.message } };
  }
  if (error instanceof SubjectNotFoundError) {
    return { success: false, error: { code: "SUBJECT_NOT_FOUND", message: error.message } };
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

export async function createExamAction(input: unknown): Promise<ActionResult<ExamDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("exam.manage");

  try {
    const exam = await createExam(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: exam };
  } catch (error) {
    return translateExamError(error);
  }
}

export async function updateExamStatusAction(
  examId: string,
  input: unknown
): Promise<ActionResult<ExamDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("exam.manage");

  try {
    const exam = await updateExamStatus(examId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: exam };
  } catch (error) {
    return translateExamError(error);
  }
}

export async function addExamSubjectAction(input: unknown): Promise<ActionResult<ExamSubjectDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("exam.subject.manage");

  try {
    const examSubject = await addExamSubject(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: examSubject };
  } catch (error) {
    return translateExamError(error);
  }
}
