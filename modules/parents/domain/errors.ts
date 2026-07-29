import { BusinessRuleError, NotFoundError, UnauthorizedError } from "@/lib/errors";

export class GuardianNotFoundError extends NotFoundError {
  constructor(message = "Guardian not found.") {
    super(message);
  }
}

export class GuardianAlreadyLinkedError extends BusinessRuleError {
  constructor(message = "This guardian already has a parent portal account.") {
    super(message);
  }
}

export class ParentAccountNotFoundError extends NotFoundError {
  constructor(message = "No parent account is linked to this guardian.") {
    super(message);
  }
}

// Thrown by assertGuardianCanAccessStudent — the row-level scoping RBAC alone can never express
// ("PARENT can view attendance" says nothing about *whose* attendance). Every parent-facing read
// service in modules/parents/application throws this before touching Attendance/Exam/Fee data.
export class StudentNotLinkedToGuardianError extends UnauthorizedError {
  constructor(message = "This student is not linked to your parent account.") {
    super(message);
  }
}
