import { BusinessRuleError, NotFoundError, ValidationError } from "@/lib/errors";

// --- Department / Designation / EmploymentType (lookup tables) -----------------------------

export class DepartmentNotFoundError extends NotFoundError {
  constructor(message = "Department not found.") {
    super(message);
  }
}

export class DepartmentAlreadyExistsError extends BusinessRuleError {
  constructor(message = "A department with this code already exists.") {
    super(message);
  }
}

export class DesignationNotFoundError extends NotFoundError {
  constructor(message = "Designation not found.") {
    super(message);
  }
}

export class DesignationAlreadyExistsError extends BusinessRuleError {
  constructor(message = "A designation with this code already exists.") {
    super(message);
  }
}

export class EmploymentTypeNotFoundError extends NotFoundError {
  constructor(message = "Employment type not found.") {
    super(message);
  }
}

export class EmploymentTypeAlreadyExistsError extends BusinessRuleError {
  constructor(message = "An employment type with this code already exists.") {
    super(message);
  }
}

// --- Employee --------------------------------------------------------------------------------

export class EmployeeNotFoundError extends NotFoundError {
  constructor(message = "Employee not found.") {
    super(message);
  }
}

export class EmployeeAlreadyExistsError extends BusinessRuleError {
  constructor(message = "This staff member already has an employee record, or the employee code is taken.") {
    super(message);
  }
}

export class InvalidReportingManagerError extends BusinessRuleError {
  constructor(message = "An employee cannot report to themselves.") {
    super(message);
  }
}

// --- Employee Document -------------------------------------------------------------------------

export class EmployeeDocumentNotFoundError extends NotFoundError {
  constructor(message = "Employee document not found.") {
    super(message);
  }
}

export class InvalidEmployeeDocumentTypeError extends ValidationError {
  constructor(message: string) {
    super(message);
  }
}

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

// --- Leave Management --------------------------------------------------------------------------

export class LeaveTypeNotFoundError extends NotFoundError {
  constructor(message = "Leave type not found.") {
    super(message);
  }
}

export class LeaveTypeAlreadyExistsError extends BusinessRuleError {
  constructor(message = "A leave type with this code already exists.") {
    super(message);
  }
}

export class LeaveRequestNotFoundError extends NotFoundError {
  constructor(message = "Leave request not found.") {
    super(message);
  }
}

export class LeaveRequestNotPendingError extends BusinessRuleError {
  constructor(message = "This leave request is no longer pending.") {
    super(message);
  }
}

export class InsufficientLeaveBalanceError extends BusinessRuleError {
  constructor(message = "This employee does not have enough leave balance for this request.") {
    super(message);
  }
}

export class LeaveRequestNotCancellableError extends BusinessRuleError {
  constructor(message = "This leave request can no longer be cancelled.") {
    super(message);
  }
}

// --- Performance Review -------------------------------------------------------------------------

export class PerformanceReviewNotFoundError extends NotFoundError {
  constructor(message = "Performance review not found.") {
    super(message);
  }
}
