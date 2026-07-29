import { ValidationError, BusinessRuleError, NotFoundError, UnauthorizedError } from "@/lib/errors";
import { StudentNotFoundError, InvalidAcademicSessionError, InvalidClassError } from "@/modules/students/domain/errors";
import { TeacherNotFoundError } from "@/modules/teachers/domain/errors";
import { ExamNotFoundError, ExamResultNotFoundError } from "@/modules/examinations/domain/errors";
import { FeePaymentNotFoundError } from "@/modules/fees/domain/errors";
import {
  GuardianAlreadyLinkedError,
  GuardianNotFoundError,
  ParentAccountNotFoundError,
  StudentNotLinkedToGuardianError,
} from "@/modules/parents/domain/errors";
import {
  HomeworkNotFoundError,
  NoticeNotFoundError,
  CalendarEventNotFoundError,
  MessageThreadNotFoundError,
  MessageThreadInactiveError,
  NotificationNotFoundError,
} from "@/modules/communication/domain/errors";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Shared by every app/parent/**/actions.ts, app/settings/parents/actions.ts, and
// app/communication/**/actions.ts file — never string-matches `error.message`, only
// `instanceof` (docs/CODING_STANDARDS.md §5), matching every other translateXError precedent in
// this codebase.
export function translateParentError(error: unknown): ActionResult<never> {
  if (error instanceof StudentNotFoundError) {
    return { success: false, error: { code: "STUDENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof InvalidAcademicSessionError) {
    return { success: false, error: { code: "INVALID_ACADEMIC_SESSION", message: error.message } };
  }
  if (error instanceof InvalidClassError) {
    return { success: false, error: { code: "INVALID_CLASS", message: error.message } };
  }
  if (error instanceof TeacherNotFoundError) {
    return { success: false, error: { code: "TEACHER_NOT_FOUND", message: error.message } };
  }
  if (error instanceof ExamNotFoundError) {
    return { success: false, error: { code: "EXAM_NOT_FOUND", message: error.message } };
  }
  if (error instanceof ExamResultNotFoundError) {
    return { success: false, error: { code: "EXAM_RESULT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof FeePaymentNotFoundError) {
    return { success: false, error: { code: "FEE_PAYMENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof GuardianAlreadyLinkedError) {
    return { success: false, error: { code: "GUARDIAN_ALREADY_LINKED", message: error.message } };
  }
  if (error instanceof GuardianNotFoundError) {
    return { success: false, error: { code: "GUARDIAN_NOT_FOUND", message: error.message } };
  }
  if (error instanceof ParentAccountNotFoundError) {
    return { success: false, error: { code: "PARENT_ACCOUNT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof StudentNotLinkedToGuardianError) {
    return { success: false, error: { code: "STUDENT_NOT_LINKED", message: error.message } };
  }
  if (error instanceof HomeworkNotFoundError) {
    return { success: false, error: { code: "HOMEWORK_NOT_FOUND", message: error.message } };
  }
  if (error instanceof NoticeNotFoundError) {
    return { success: false, error: { code: "NOTICE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof CalendarEventNotFoundError) {
    return { success: false, error: { code: "CALENDAR_EVENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof MessageThreadNotFoundError) {
    return { success: false, error: { code: "MESSAGE_THREAD_NOT_FOUND", message: error.message } };
  }
  if (error instanceof MessageThreadInactiveError) {
    return { success: false, error: { code: "MESSAGE_THREAD_INACTIVE", message: error.message } };
  }
  if (error instanceof NotificationNotFoundError) {
    return { success: false, error: { code: "NOTIFICATION_NOT_FOUND", message: error.message } };
  }
  if (error instanceof UnauthorizedError) {
    return { success: false, error: { code: "UNAUTHORIZED", message: error.message } };
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
