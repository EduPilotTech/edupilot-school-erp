import { BusinessRuleError, NotFoundError } from "@/lib/errors";

// Phase 6 — Academic Structure Extensions. Subject/Classroom errors, following the same
// BusinessRuleError/NotFoundError subclass hierarchy as modules/students/domain/errors.ts.
export class SubjectNotFoundError extends NotFoundError {
  constructor(message = "Subject not found.") {
    super(message);
  }
}

export class SubjectAlreadyExistsError extends BusinessRuleError {
  constructor(message = "A subject with this code already exists.") {
    super(message);
  }
}

export class ClassroomNotFoundError extends NotFoundError {
  constructor(message = "Classroom not found.") {
    super(message);
  }
}

export class ClassroomAlreadyExistsError extends BusinessRuleError {
  constructor(message = "A classroom with this code already exists.") {
    super(message);
  }
}

// Academic Setup — Academic Session / Class / Section creation, backing the master-data flow a
// new school needs before Student Admission's dropdowns have anything to show.
export class AcademicSessionNotFoundError extends NotFoundError {
  constructor(message = "Academic session not found.") {
    super(message);
  }
}

export class ClassNotFoundError extends NotFoundError {
  constructor(message = "Class not found.") {
    super(message);
  }
}

// Backed by Class's real @@unique([tenantId, academicSessionId, name]) constraint.
export class ClassAlreadyExistsError extends BusinessRuleError {
  constructor(message = "A class with this name already exists in this academic session.") {
    super(message);
  }
}

export class SectionNotFoundError extends NotFoundError {
  constructor(message = "Section not found.") {
    super(message);
  }
}

// Backed by Section's real @@unique([tenantId, classId, name]) constraint.
export class SectionAlreadyExistsError extends BusinessRuleError {
  constructor(message = "A section with this name already exists in this class.") {
    super(message);
  }
}
