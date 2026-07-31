import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import {
  DepartmentNotFoundError,
  DepartmentAlreadyExistsError,
  DesignationNotFoundError,
  DesignationAlreadyExistsError,
  EmploymentTypeNotFoundError,
  EmploymentTypeAlreadyExistsError,
  EmployeeNotFoundError,
  EmployeeAlreadyExistsError,
  InvalidReportingManagerError,
  EmployeeDocumentNotFoundError,
  InvalidEmployeeDocumentTypeError,
  DocumentTooLargeError,
  UnsupportedFileTypeError,
  LeaveTypeNotFoundError,
  LeaveTypeAlreadyExistsError,
  LeaveRequestNotFoundError,
  LeaveRequestNotPendingError,
  InsufficientLeaveBalanceError,
  LeaveRequestNotCancellableError,
  PerformanceReviewNotFoundError,
} from "@/modules/hr/domain/errors";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Shared by every app/hr/**/actions.ts file — instanceof-only, matching translateLibraryError.ts's
// own precedent (docs/CODING_STANDARDS.md §5). Unexpected errors are rethrown, never swallowed.
export function translateHrError(error: unknown): ActionResult<never> {
  if (error instanceof DepartmentAlreadyExistsError) {
    return { success: false, error: { code: "DEPARTMENT_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof DepartmentNotFoundError) {
    return { success: false, error: { code: "DEPARTMENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof DesignationAlreadyExistsError) {
    return { success: false, error: { code: "DESIGNATION_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof DesignationNotFoundError) {
    return { success: false, error: { code: "DESIGNATION_NOT_FOUND", message: error.message } };
  }
  if (error instanceof EmploymentTypeAlreadyExistsError) {
    return { success: false, error: { code: "EMPLOYMENT_TYPE_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof EmploymentTypeNotFoundError) {
    return { success: false, error: { code: "EMPLOYMENT_TYPE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof EmployeeAlreadyExistsError) {
    return { success: false, error: { code: "EMPLOYEE_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof InvalidReportingManagerError) {
    return { success: false, error: { code: "INVALID_REPORTING_MANAGER", message: error.message } };
  }
  if (error instanceof EmployeeNotFoundError) {
    return { success: false, error: { code: "EMPLOYEE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof InvalidEmployeeDocumentTypeError) {
    return { success: false, error: { code: "INVALID_EMPLOYEE_DOCUMENT_TYPE", message: error.message } };
  }
  if (error instanceof DocumentTooLargeError) {
    return { success: false, error: { code: "DOCUMENT_TOO_LARGE", message: error.message } };
  }
  if (error instanceof UnsupportedFileTypeError) {
    return { success: false, error: { code: "UNSUPPORTED_FILE_TYPE", message: error.message } };
  }
  if (error instanceof EmployeeDocumentNotFoundError) {
    return { success: false, error: { code: "EMPLOYEE_DOCUMENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof LeaveTypeAlreadyExistsError) {
    return { success: false, error: { code: "LEAVE_TYPE_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof LeaveTypeNotFoundError) {
    return { success: false, error: { code: "LEAVE_TYPE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof InsufficientLeaveBalanceError) {
    return { success: false, error: { code: "INSUFFICIENT_LEAVE_BALANCE", message: error.message } };
  }
  if (error instanceof LeaveRequestNotPendingError) {
    return { success: false, error: { code: "LEAVE_REQUEST_NOT_PENDING", message: error.message } };
  }
  if (error instanceof LeaveRequestNotCancellableError) {
    return { success: false, error: { code: "LEAVE_REQUEST_NOT_CANCELLABLE", message: error.message } };
  }
  if (error instanceof LeaveRequestNotFoundError) {
    return { success: false, error: { code: "LEAVE_REQUEST_NOT_FOUND", message: error.message } };
  }
  if (error instanceof PerformanceReviewNotFoundError) {
    return { success: false, error: { code: "PERFORMANCE_REVIEW_NOT_FOUND", message: error.message } };
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
