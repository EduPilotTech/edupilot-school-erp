import { BusinessRuleError, NotFoundError } from "@/lib/errors";

// Phase 7 — Examination & Assessment Management. `InvalidAcademicSessionError`/
// `InvalidClassError`/`InvalidSectionError` are deliberately NOT redefined here — reused
// directly from modules/students/domain/errors.ts, same cross-module reuse convention as
// modules/attendance and modules/timetable already established. `SubjectNotFoundError` is
// likewise reused from modules/academics/domain/errors.ts, and `TeacherNotFoundError` from
// modules/teachers/domain/errors.ts.

export class ExamTypeNotFoundError extends NotFoundError {
  constructor(message = "Exam type not found.") {
    super(message);
  }
}

export class ExamTypeAlreadyExistsError extends BusinessRuleError {
  constructor(message = "An exam type with this code already exists.") {
    super(message);
  }
}

export class GradeScaleNotFoundError extends NotFoundError {
  constructor(message = "Grade scale not found.") {
    super(message);
  }
}

export class GradeScaleAlreadyExistsError extends BusinessRuleError {
  constructor(message = "A grade scale with this name already exists for this academic session.") {
    super(message);
  }
}

export class InvalidGradeBandsError extends BusinessRuleError {
  constructor(message = "Grade bands must be ordered and must not overlap.") {
    super(message);
  }
}

export class ExamNotFoundError extends NotFoundError {
  constructor(message = "Exam not found.") {
    super(message);
  }
}

export class ExamAlreadyExistsError extends BusinessRuleError {
  constructor(message = "An exam with this name already exists for this academic session.") {
    super(message);
  }
}

// Every Exam-lifecycle-gated action (add/remove ExamSubject, enter marks, generate results,
// publish) throws this when the exam's current `status` doesn't permit it — always includes
// which status was required, since "invalid state" alone isn't actionable for the caller.
export class InvalidExamStatusError extends BusinessRuleError {
  constructor(message = "This action is not allowed in the exam's current status.") {
    super(message);
  }
}

export class ExamSubjectNotFoundError extends NotFoundError {
  constructor(message = "This subject is not part of this exam for this class.") {
    super(message);
  }
}

export class ExamSubjectAlreadyExistsError extends BusinessRuleError {
  constructor(message = "This subject is already part of this exam for this class.") {
    super(message);
  }
}

export class InvalidMarksError extends BusinessRuleError {
  constructor(message = "Marks obtained cannot exceed the maximum marks for this subject.") {
    super(message);
  }
}

// Phase 7 Decision 4: a Teacher may only enter marks for an ExamSubject whose Class they hold a
// matching, active TeacherAssignment for (subject + class); Admin/Principal bypass this check
// entirely (see marks-authorization.helpers.ts).
export class MarksEntryNotAuthorizedError extends BusinessRuleError {
  constructor(message = "You are not assigned to teach this subject for this class.") {
    super(message);
  }
}

export class StudentNotEnrolledError extends BusinessRuleError {
  constructor(message = "This student is not currently enrolled in this class.") {
    super(message);
  }
}

export class ExamResultNotFoundError extends NotFoundError {
  constructor(message = "No result has been generated for this student and exam yet.") {
    super(message);
  }
}

// Thrown when result generation is attempted before every ExamSubject for the student's class
// has a MarksEntry row — generating a partial result would silently understate the total.
export class IncompleteMarksEntryError extends BusinessRuleError {
  constructor(message = "Marks have not been entered for every subject yet.") {
    super(message);
  }
}
