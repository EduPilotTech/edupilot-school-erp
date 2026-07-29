import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import {
  StudentNotFoundError,
  InvalidAcademicSessionError,
  InvalidClassError,
  StudentNotEnrolledInSessionError,
} from "@/modules/students/domain/errors";
import {
  FeeCategoryAlreadyExistsError,
  FeeCategoryNotFoundError,
  FeeStructureAlreadyExistsError,
  FeeStructureNotFoundError,
  FeeStructureItemAlreadyExistsError,
  FeeStructureItemNotFoundError,
  StudentFeeAssignmentNotFoundError,
  InstallmentPlanNotFoundError,
  InvalidInstallmentPlanError,
  FineRuleNotFoundError,
  FeeConcessionNotFoundError,
  FeeInvoiceNotFoundError,
  InvoiceAlreadyGeneratedError,
  InvoiceHasPaymentsError,
  InvoiceNotCancellableError,
  FeePaymentNotFoundError,
  OverpaymentError,
  PaymentAlreadyReversedError,
  PaymentNotReversibleError,
} from "@/modules/fees/domain/errors";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Shared by every app/fees/**/actions.ts file — never string-matches `error.message`, only
// `instanceof` (docs/CODING_STANDARDS.md §5), matching app/attendance/actions.ts's own
// `translateAttendanceError` precedent. Unexpected errors are rethrown, never swallowed.
export function translateFeeError(error: unknown): ActionResult<never> {
  if (error instanceof StudentNotFoundError) {
    return { success: false, error: { code: "STUDENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof InvalidAcademicSessionError) {
    return { success: false, error: { code: "INVALID_ACADEMIC_SESSION", message: error.message } };
  }
  if (error instanceof InvalidClassError) {
    return { success: false, error: { code: "INVALID_CLASS", message: error.message } };
  }
  if (error instanceof StudentNotEnrolledInSessionError) {
    return { success: false, error: { code: "STUDENT_NOT_ENROLLED", message: error.message } };
  }
  if (error instanceof FeeCategoryAlreadyExistsError) {
    return { success: false, error: { code: "FEE_CATEGORY_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof FeeCategoryNotFoundError) {
    return { success: false, error: { code: "FEE_CATEGORY_NOT_FOUND", message: error.message } };
  }
  if (error instanceof FeeStructureAlreadyExistsError) {
    return { success: false, error: { code: "FEE_STRUCTURE_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof FeeStructureNotFoundError) {
    return { success: false, error: { code: "FEE_STRUCTURE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof FeeStructureItemAlreadyExistsError) {
    return { success: false, error: { code: "FEE_STRUCTURE_ITEM_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof FeeStructureItemNotFoundError) {
    return { success: false, error: { code: "FEE_STRUCTURE_ITEM_NOT_FOUND", message: error.message } };
  }
  if (error instanceof StudentFeeAssignmentNotFoundError) {
    return { success: false, error: { code: "STUDENT_FEE_ASSIGNMENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof InstallmentPlanNotFoundError) {
    return { success: false, error: { code: "INSTALLMENT_PLAN_NOT_FOUND", message: error.message } };
  }
  if (error instanceof InvalidInstallmentPlanError) {
    return { success: false, error: { code: "INVALID_INSTALLMENT_PLAN", message: error.message } };
  }
  if (error instanceof FineRuleNotFoundError) {
    return { success: false, error: { code: "FINE_RULE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof FeeConcessionNotFoundError) {
    return { success: false, error: { code: "FEE_CONCESSION_NOT_FOUND", message: error.message } };
  }
  if (error instanceof InvoiceAlreadyGeneratedError) {
    return { success: false, error: { code: "INVOICE_ALREADY_GENERATED", message: error.message } };
  }
  if (error instanceof InvoiceHasPaymentsError) {
    return { success: false, error: { code: "INVOICE_HAS_PAYMENTS", message: error.message } };
  }
  if (error instanceof InvoiceNotCancellableError) {
    return { success: false, error: { code: "INVOICE_NOT_CANCELLABLE", message: error.message } };
  }
  if (error instanceof FeeInvoiceNotFoundError) {
    return { success: false, error: { code: "FEE_INVOICE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof OverpaymentError) {
    return { success: false, error: { code: "OVERPAYMENT", message: error.message } };
  }
  if (error instanceof PaymentAlreadyReversedError) {
    return { success: false, error: { code: "PAYMENT_ALREADY_REVERSED", message: error.message } };
  }
  if (error instanceof PaymentNotReversibleError) {
    return { success: false, error: { code: "PAYMENT_NOT_REVERSIBLE", message: error.message } };
  }
  if (error instanceof FeePaymentNotFoundError) {
    return { success: false, error: { code: "FEE_PAYMENT_NOT_FOUND", message: error.message } };
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
