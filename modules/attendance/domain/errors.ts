import { BusinessRuleError } from "@/lib/errors";

// Phase 5 — Attendance Management. Deliberately does NOT redefine "invalid academic session/
// class/section" or "student not found" errors — those already exist in
// modules/students/domain/errors.ts (InvalidAcademicSessionError, InvalidClassError,
// InvalidSectionError, StudentNotFoundError) and mean exactly the same thing here; attendance
// services import and reuse them directly rather than duplicating equivalent classes.
//
// This file only adds what's genuinely new to attendance: date validity.
export class InvalidAttendanceDateError extends BusinessRuleError {
  constructor(message = "Attendance cannot be marked for a future date.") {
    super(message);
  }
}

// The given date falls outside the referenced Academic Session's start/end range — "session-aware"
// validation (Phase 5's explicit requirement), distinct from InvalidAcademicSessionError (which
// covers the session not existing/belonging to the tenant at all).
export class AttendanceDateOutsideSessionError extends BusinessRuleError {
  constructor(message = "The selected date falls outside the academic session's date range.") {
    super(message);
  }
}
