"use server";

// Thin Server Actions only — no business logic here, matching app/attendance/actions.ts exactly.
// Reads (class/teacher/classroom timetables) intentionally have NO Server Actions — they're pure
// reads, called directly from Server Component pages per this codebase's established convention.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import {
  InvalidAcademicSessionError,
  InvalidClassError,
  InvalidSectionError,
} from "@/modules/students/domain/errors";
import { SubjectNotFoundError, ClassroomNotFoundError } from "@/modules/academics/domain/errors";
import { TeacherNotFoundError } from "@/modules/teachers/domain/errors";
import { assignTeacher } from "@/modules/timetable/application/assign-teacher.service";
import { removeAssignment } from "@/modules/timetable/application/remove-assignment.service";
import { createTimetableEntry } from "@/modules/timetable/application/create-timetable-entry.service";
import { updateTimetableEntry } from "@/modules/timetable/application/update-timetable-entry.service";
import { deleteTimetableEntry } from "@/modules/timetable/application/delete-timetable-entry.service";
import {
  ClassroomConflictError,
  InvalidPeriodError,
  NotAWorkingDayError,
  SectionConflictError,
  TeacherAssignmentInUseError,
  TeacherAssignmentNotFoundError,
  TeacherConflictError,
  TimetableEntryNotFoundError,
} from "@/modules/timetable/domain/errors";
import type { TeacherAssignmentDTO } from "@/modules/timetable/application/dto/teacher-assignment.dto";
import type { TimetableEntryDTO } from "@/modules/timetable/application/dto/timetable-entry.dto";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Shared by every action below — never string-matches `error.message`, only `instanceof`
// (docs/CODING_STANDARDS.md §5). Unexpected errors are rethrown, never swallowed.
function translateTimetableError(error: unknown): ActionResult<never> {
  if (error instanceof SectionConflictError) {
    return { success: false, error: { code: "SECTION_CONFLICT", message: error.message } };
  }
  if (error instanceof TeacherConflictError) {
    return { success: false, error: { code: "TEACHER_CONFLICT", message: error.message } };
  }
  if (error instanceof ClassroomConflictError) {
    return { success: false, error: { code: "CLASSROOM_CONFLICT", message: error.message } };
  }
  if (error instanceof InvalidPeriodError) {
    return { success: false, error: { code: "INVALID_PERIOD", message: error.message } };
  }
  if (error instanceof NotAWorkingDayError) {
    return { success: false, error: { code: "NOT_A_WORKING_DAY", message: error.message } };
  }
  if (error instanceof TeacherAssignmentInUseError) {
    return { success: false, error: { code: "ASSIGNMENT_IN_USE", message: error.message } };
  }
  if (error instanceof TeacherAssignmentNotFoundError) {
    return { success: false, error: { code: "ASSIGNMENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof TimetableEntryNotFoundError) {
    return { success: false, error: { code: "ENTRY_NOT_FOUND", message: error.message } };
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
  if (error instanceof SubjectNotFoundError) {
    return { success: false, error: { code: "SUBJECT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof ClassroomNotFoundError) {
    return { success: false, error: { code: "CLASSROOM_NOT_FOUND", message: error.message } };
  }
  if (error instanceof TeacherNotFoundError) {
    return { success: false, error: { code: "TEACHER_NOT_FOUND", message: error.message } };
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

export async function assignTeacherAction(input: unknown): Promise<ActionResult<TeacherAssignmentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("teacher.assignment.manage");

  try {
    const assignment = await assignTeacher(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: assignment };
  } catch (error) {
    return translateTimetableError(error);
  }
}

export async function removeAssignmentAction(assignmentId: string): Promise<ActionResult<TeacherAssignmentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("teacher.assignment.manage");

  try {
    const assignment = await removeAssignment(assignmentId, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: assignment };
  } catch (error) {
    return translateTimetableError(error);
  }
}

export async function createTimetableEntryAction(input: unknown): Promise<ActionResult<TimetableEntryDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("timetable.manage");

  try {
    const entry = await createTimetableEntry(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: entry };
  } catch (error) {
    return translateTimetableError(error);
  }
}

export async function updateTimetableEntryAction(
  entryId: string,
  input: unknown
): Promise<ActionResult<TimetableEntryDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("timetable.manage");

  try {
    const entry = await updateTimetableEntry(entryId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: entry };
  } catch (error) {
    return translateTimetableError(error);
  }
}

export async function deleteTimetableEntryAction(entryId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("timetable.manage");

  try {
    await deleteTimetableEntry(entryId, { tenantId: authContext.tenantId });
    return { success: true, data: null };
  } catch (error) {
    return translateTimetableError(error);
  }
}
