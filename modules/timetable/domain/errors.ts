import { BusinessRuleError, NotFoundError } from "@/lib/errors";

// Phase 6 — Timetable Management. `InvalidAcademicSessionError`/`InvalidClassError`/
// `InvalidSectionError` are deliberately NOT redefined here — reused directly from
// modules/students/domain/errors.ts, same as modules/attendance/domain/errors.ts already does,
// since they represent exactly the same concept (a session/class/section that doesn't exist,
// is soft-deleted, or doesn't belong to its stated parent).

export class HolidayOutsideSessionError extends BusinessRuleError {
  constructor(message = "The selected date falls outside the academic session's date range.") {
    super(message);
  }
}

export class HolidayAlreadyExistsError extends BusinessRuleError {
  constructor(message = "A holiday is already recorded for this date.") {
    super(message);
  }
}

export class HolidayNotFoundError extends NotFoundError {
  constructor(message = "Holiday not found.") {
    super(message);
  }
}

export class InvalidPeriodConfigurationError extends BusinessRuleError {
  constructor(message = "Periods must be ordered and must not overlap.") {
    super(message);
  }
}

export class NoWorkingDaysError extends BusinessRuleError {
  constructor(message = "At least one working day is required.") {
    super(message);
  }
}

// Teacher/Subject/Classroom "not found" errors are deliberately NOT redefined here — reused
// directly from modules/teachers/domain/errors.ts and modules/academics/domain/errors.ts, same
// cross-module reuse convention as modules/attendance/domain/errors.ts.

export class TeacherAssignmentNotFoundError extends NotFoundError {
  constructor(message = "This teacher is not assigned to teach this subject for this class/section.") {
    super(message);
  }
}

export class InvalidPeriodError extends BusinessRuleError {
  constructor(message = "Select a valid, non-break period for this academic session.") {
    super(message);
  }
}

export class NotAWorkingDayError extends BusinessRuleError {
  constructor(message = "The selected day is not a working day for this academic session.") {
    super(message);
  }
}

// No "DateIsHolidayError" — TimetableEntry is a recurring weekly pattern (dayOfWeek), not a
// specific calendar date, so Holiday (a one-off calendar-date suspension) has no scheduling-time
// check to perform here. A holiday suspends a given date's actual instruction, not the recurring
// slot's existence — that's an Attendance-side concern, explicitly out of this phase's scope.

export class SectionConflictError extends BusinessRuleError {
  constructor(message = "This section already has a class scheduled at this day and period.") {
    super(message);
  }
}

export class TeacherConflictError extends BusinessRuleError {
  constructor(message = "This teacher is already scheduled to teach another class at this day and period.") {
    super(message);
  }
}

export class ClassroomConflictError extends BusinessRuleError {
  constructor(message = "This classroom is already booked at this day and period.") {
    super(message);
  }
}

export class TimetableEntryNotFoundError extends NotFoundError {
  constructor(message = "Timetable entry not found.") {
    super(message);
  }
}

// Phase 6.1 — guards remove-assignment.service.ts: deactivating a TeacherAssignment that still
// has an active TimetableEntry pointing at it would orphan a live timetable slot (the entry's
// `teacherAssignmentId` FK stays technically valid, but the assignment it names is no longer
// active). The caller must clear or reassign those timetable entries first.
export class TeacherAssignmentInUseError extends BusinessRuleError {
  constructor(
    message = "This teacher assignment is still used by one or more active timetable entries. Remove those entries first."
  ) {
    super(message);
  }
}
