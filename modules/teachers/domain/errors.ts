import { BusinessRuleError, NotFoundError } from "@/lib/errors";

export class TeacherNotFoundError extends NotFoundError {
  constructor(message = "Teacher not found.") {
    super(message);
  }
}

export class TeacherAlreadyExistsError extends BusinessRuleError {
  constructor(message = "This staff member already has a teacher record, or the employee code is taken.") {
    super(message);
  }
}

// Phase 6 Decision 1: Teacher is a 1:1 extension of UserProfile — but only for users who actually
// hold the TEACHER or CLASS_TEACHER role. Promoting a UserProfile with an unrelated role (e.g.
// ACCOUNTANT) into a Teacher record would silently misrepresent who can be scheduled to teach.
export class TeacherRoleRequiredError extends BusinessRuleError {
  constructor(message = "This user must hold the Teacher or Class Teacher role before becoming a Teacher.") {
    super(message);
  }
}
