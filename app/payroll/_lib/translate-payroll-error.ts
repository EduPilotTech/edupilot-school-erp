import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import { EmployeeNotFoundError } from "@/modules/hr/domain/errors";
import {
  SalaryStructureNotFoundError,
  SalaryStructureAlreadyExistsError,
  SalaryComponentNotFoundError,
  SalaryComponentAlreadyExistsError,
  NoSalaryAssignmentError,
  InvalidSalaryAssignmentError,
  EmployeeLoanNotFoundError,
  InvalidLoanAmountError,
  LoanCannotBeCancelledError,
  PayrollRunNotFoundError,
  PayrollRunAlreadyExistsError,
  PayrollRunNotDraftError,
  PayrollRunNotProcessedError,
  PayrollRunLockedError,
  PayslipNotFoundError,
  SalaryPaymentNotFoundError,
  OverpaymentError,
  PaymentAlreadyReversedError,
} from "@/modules/payroll/domain/errors";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Shared by every app/payroll/**/actions.ts file — instanceof-only, matching translateHrError.ts's
// own precedent (docs/CODING_STANDARDS.md §5). Unexpected errors are rethrown, never swallowed.
// Also handles modules/hr's EmployeeNotFoundError — several payroll application services (assign-
// salary, employee-loan) look up the employee via modules/hr and throw its error type directly.
export function translatePayrollError(error: unknown): ActionResult<never> {
  if (error instanceof SalaryStructureAlreadyExistsError) {
    return { success: false, error: { code: "SALARY_STRUCTURE_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof SalaryStructureNotFoundError) {
    return { success: false, error: { code: "SALARY_STRUCTURE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof SalaryComponentAlreadyExistsError) {
    return { success: false, error: { code: "SALARY_COMPONENT_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof SalaryComponentNotFoundError) {
    return { success: false, error: { code: "SALARY_COMPONENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof InvalidSalaryAssignmentError) {
    return { success: false, error: { code: "INVALID_SALARY_ASSIGNMENT", message: error.message } };
  }
  if (error instanceof NoSalaryAssignmentError) {
    return { success: false, error: { code: "NO_SALARY_ASSIGNMENT", message: error.message } };
  }
  if (error instanceof EmployeeNotFoundError) {
    return { success: false, error: { code: "EMPLOYEE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof InvalidLoanAmountError) {
    return { success: false, error: { code: "INVALID_LOAN_AMOUNT", message: error.message } };
  }
  if (error instanceof LoanCannotBeCancelledError) {
    return { success: false, error: { code: "LOAN_CANNOT_BE_CANCELLED", message: error.message } };
  }
  if (error instanceof EmployeeLoanNotFoundError) {
    return { success: false, error: { code: "EMPLOYEE_LOAN_NOT_FOUND", message: error.message } };
  }
  if (error instanceof PayrollRunAlreadyExistsError) {
    return { success: false, error: { code: "PAYROLL_RUN_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof PayrollRunNotDraftError) {
    return { success: false, error: { code: "PAYROLL_RUN_NOT_DRAFT", message: error.message } };
  }
  if (error instanceof PayrollRunNotProcessedError) {
    return { success: false, error: { code: "PAYROLL_RUN_NOT_PROCESSED", message: error.message } };
  }
  if (error instanceof PayrollRunLockedError) {
    return { success: false, error: { code: "PAYROLL_RUN_LOCKED", message: error.message } };
  }
  if (error instanceof PayrollRunNotFoundError) {
    return { success: false, error: { code: "PAYROLL_RUN_NOT_FOUND", message: error.message } };
  }
  if (error instanceof PayslipNotFoundError) {
    return { success: false, error: { code: "PAYSLIP_NOT_FOUND", message: error.message } };
  }
  if (error instanceof OverpaymentError) {
    return { success: false, error: { code: "OVERPAYMENT", message: error.message } };
  }
  if (error instanceof PaymentAlreadyReversedError) {
    return { success: false, error: { code: "PAYMENT_ALREADY_REVERSED", message: error.message } };
  }
  if (error instanceof SalaryPaymentNotFoundError) {
    return { success: false, error: { code: "SALARY_PAYMENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof NotFoundError) {
    return { success: false, error: { code: "NOT_FOUND", message: error.message } };
  }
  if (error instanceof BusinessRuleError) {
    return { success: false, error: { code: "BUSINESS_RULE_VIOLATION", message: error.message } };
  }
  if (error instanceof ValidationError) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: error.message } };
  }

  throw error;
}
