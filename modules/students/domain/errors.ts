import { BusinessRuleError, NotFoundError } from "@/lib/errors";

// Admission-specific errors (Sprint 4 — Step 4, Step 7), each a BusinessRuleError subclass per
// docs/CODING_STANDARDS.md §5's base hierarchy (lib/errors.ts). Thrown by
// modules/students/application/admit-student.service.ts, caught and translated into an
// ActionResult<T> at the Server Action boundary via `instanceof` matching — never by
// string-matching `error.message`. (For plain input-shape validation failures, the service
// throws the base `ValidationError` from lib/errors.ts directly — no subclass needed there.)
export class InvalidAcademicSessionError extends BusinessRuleError {
  constructor(message = "Select a valid, active academic session.") {
    super(message);
  }
}

export class InvalidClassError extends BusinessRuleError {
  constructor(message = "Select a valid class for the chosen academic session.") {
    super(message);
  }
}

export class InvalidSectionError extends BusinessRuleError {
  constructor(message = "Select a valid section for the chosen class.") {
    super(message);
  }
}

export class GuardianRequiredError extends BusinessRuleError {
  constructor(message = "At least one guardian (father, mother, or local guardian) is required.") {
    super(message);
  }
}

// Duplicate-Aadhaar checking is deferred this step (Student has no `aadhaarNumber` column yet —
// see Sprint 4 — Step 4 conflict resolution). This error instead guards the one duplicate that
// *is* enforceable against the current schema: an admission-number collision, backstopped by
// the `@@unique([tenantId, admissionNumber])` constraint (see admit-student.service.ts).
export class StudentAlreadyExistsError extends BusinessRuleError {
  constructor(message = "A student with this admission number already exists.") {
    super(message);
  }
}

// Sprint 4 — Step 6: thrown by get-student-profile.service.ts when no student matches the given
// id for the caller's tenant, or when the matching row is soft-deleted. Soft-deleted students
// are treated as not found rather than given a distinct "this is deleted" response — the same
// "cross-tenant = not found" security convention established in Step 4, and consistent with
// Step 5's list excluding soft-deleted students entirely.
export class StudentNotFoundError extends NotFoundError {
  constructor(message = "Student not found.") {
    super(message);
  }
}

// Sprint 4.8A — Student Document Infrastructure. Defined now (alongside the repository/storage
// layers) so Sprint 4.8B's upload/delete application services have a ready-made, established
// hierarchy to throw — not used by any service yet this step (no Application Services or Server
// Actions are built in 4.8A, per its own scope). See lib/document-validation.ts for the limits
// these two guard.
export class DocumentTooLargeError extends BusinessRuleError {
  constructor(message = "This file exceeds the maximum allowed size.") {
    super(message);
  }
}

export class UnsupportedFileTypeError extends BusinessRuleError {
  constructor(message = "This file type is not supported.") {
    super(message);
  }
}

// Thrown when a lookup by (tenantId, documentId) finds nothing, or finds a soft-deleted row —
// same "soft-deleted = not found" convention as StudentNotFoundError above.
export class DocumentNotFoundError extends NotFoundError {
  constructor(message = "Document not found.") {
    super(message);
  }
}
