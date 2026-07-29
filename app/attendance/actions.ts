"use server";

// Thin Server Actions only — no business logic here, matching every other actions.ts in this
// codebase (app/students/new/actions.ts, app/students/[studentId]/documents/actions.ts). Reports
// (Daily/Monthly/Student-wise/Class-wise) intentionally have NO Server Actions — they're pure
// reads, called directly from Server Component pages per this codebase's established convention
// (see modules/students/application/list-students.service.ts's usage in app/students/page.tsx).
//
// Permission mapping: `attendance.student.mark` gates both single-mark and bulk-mark (bulk-mark
// is the same action repeated, not a distinct capability); `attendance.teacher.mark` gates
// marking staff/teacher attendance, a separate, more restricted permission (see prisma/seed.ts's
// Phase 5 comment — Teacher/Class Teacher can mark student attendance but not staff attendance).

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import { markStudentAttendance } from "@/modules/attendance/application/mark-student-attendance.service";
import { bulkMarkStudentAttendance } from "@/modules/attendance/application/bulk-mark-student-attendance.service";
import { markTeacherAttendance } from "@/modules/attendance/application/mark-teacher-attendance.service";
import {
  InvalidAcademicSessionError,
  InvalidClassError,
  InvalidSectionError,
  StudentNotFoundError,
} from "@/modules/students/domain/errors";
import { InvalidAttendanceDateError, AttendanceDateOutsideSessionError } from "@/modules/attendance/domain/errors";
import type {
  StudentAttendanceDTO,
  TeacherAttendanceDTO,
} from "@/modules/attendance/application/dto/attendance.dto";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Shared by all three actions below — never string-matches `error.message`, only `instanceof`
// (docs/CODING_STANDARDS.md §5). Unexpected errors are rethrown, never swallowed.
function translateAttendanceError(error: unknown): ActionResult<never> {
  if (error instanceof StudentNotFoundError) {
    return { success: false, error: { code: "STUDENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof InvalidAcademicSessionError) {
    return { success: false, error: { code: "INVALID_ACADEMIC_SESSION", message: error.message } };
  }
  if (error instanceof InvalidClassError) {
    return { success: false, error: { code: "INVALID_CLASS", message: error.message } };
  }
  if (error instanceof InvalidSectionError) {
    return { success: false, error: { code: "INVALID_SECTION", message: error.message } };
  }
  if (error instanceof AttendanceDateOutsideSessionError) {
    return { success: false, error: { code: "DATE_OUTSIDE_SESSION", message: error.message } };
  }
  if (error instanceof InvalidAttendanceDateError) {
    return { success: false, error: { code: "INVALID_ATTENDANCE_DATE", message: error.message } };
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

export async function markStudentAttendanceAction(
  input: unknown
): Promise<ActionResult<StudentAttendanceDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("attendance.student.mark");

  try {
    const attendance = await markStudentAttendance(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: attendance };
  } catch (error) {
    return translateAttendanceError(error);
  }
}

export async function bulkMarkAttendanceAction(
  input: unknown
): Promise<ActionResult<StudentAttendanceDTO[]>> {
  const authContext = await requireAuthContext();
  await requirePermission("attendance.student.mark");

  try {
    const attendance = await bulkMarkStudentAttendance(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: attendance };
  } catch (error) {
    return translateAttendanceError(error);
  }
}

export async function markTeacherAttendanceAction(
  input: unknown
): Promise<ActionResult<TeacherAttendanceDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("attendance.teacher.mark");

  try {
    const attendance = await markTeacherAttendance(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: attendance };
  } catch (error) {
    return translateAttendanceError(error);
  }
}
