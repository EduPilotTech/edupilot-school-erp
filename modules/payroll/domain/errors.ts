import { BusinessRuleError, NotFoundError, ValidationError } from "@/lib/errors";

// Mirrors modules/hr/domain/errors.ts's exact style — every payroll-specific failure is a named
// subclass of one of the three base error types in @/lib/errors, never a bare Error or a
// string-matched message.

// --- Salary Structure / Component -------------------------------------------------------------

export class SalaryStructureNotFoundError extends NotFoundError {
  constructor(message = "Salary structure not found.") {
    super(message);
  }
}

export class SalaryStructureAlreadyExistsError extends BusinessRuleError {
  constructor(message = "A salary structure with this name already exists for this school.") {
    super(message);
  }
}

export class SalaryComponentNotFoundError extends NotFoundError {
  constructor(message = "Salary component not found.") {
    super(message);
  }
}

export class SalaryComponentAlreadyExistsError extends BusinessRuleError {
  constructor(message = "A salary component with this code already exists in this structure.") {
    super(message);
  }
}

// --- Employee Salary Assignment -----------------------------------------------------------------

export class NoSalaryAssignmentError extends BusinessRuleError {
  constructor(message = "This employee has no current salary assignment.") {
    super(message);
  }
}

export class InvalidSalaryAssignmentError extends ValidationError {
  constructor(message: string) {
    super(message);
  }
}

// --- Employee Loan / Advance ---------------------------------------------------------------------

export class EmployeeLoanNotFoundError extends NotFoundError {
  constructor(message = "Loan/advance record not found.") {
    super(message);
  }
}

export class InvalidLoanAmountError extends ValidationError {
  constructor(message: string) {
    super(message);
  }
}

export class LoanCannotBeCancelledError extends BusinessRuleError {
  constructor(message = "This loan can no longer be cancelled — a recovery has already been made against it.") {
    super(message);
  }
}

// --- Payroll Run / Payslip -----------------------------------------------------------------------

export class PayrollRunNotFoundError extends NotFoundError {
  constructor(message = "Payroll run not found.") {
    super(message);
  }
}

export class PayrollRunAlreadyExistsError extends BusinessRuleError {
  constructor(message = "A payroll run already exists for this school and billing period.") {
    super(message);
  }
}

export class PayrollRunNotDraftError extends BusinessRuleError {
  constructor(message = "This payroll run has already been processed and cannot be processed again.") {
    super(message);
  }
}

export class PayrollRunNotProcessedError extends BusinessRuleError {
  constructor(message = "This payroll run must be processed before it can be locked.") {
    super(message);
  }
}

export class PayrollRunLockedError extends BusinessRuleError {
  constructor(message = "This payroll run is locked — its payslips can no longer be regenerated.") {
    super(message);
  }
}

export class PayslipNotFoundError extends NotFoundError {
  constructor(message = "Payslip not found.") {
    super(message);
  }
}

// --- Salary Payment --------------------------------------------------------------------------------

export class SalaryPaymentNotFoundError extends NotFoundError {
  constructor(message = "Salary payment not found.") {
    super(message);
  }
}

export class OverpaymentError extends BusinessRuleError {
  constructor(message = "This payment would exceed the payslip's net pay.") {
    super(message);
  }
}

export class PaymentAlreadyReversedError extends BusinessRuleError {
  constructor(message = "This payment has already been reversed.") {
    super(message);
  }
}
