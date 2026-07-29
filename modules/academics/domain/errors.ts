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
