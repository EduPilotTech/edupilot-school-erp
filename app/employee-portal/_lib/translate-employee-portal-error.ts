import { translateHrError, type ActionResult } from "@/app/hr/_lib/translate-hr-error";

// Every error class the Employee Portal's write actions can throw (EmployeeNotFoundError,
// LeaveTypeNotFoundError, InsufficientLeaveBalanceError, LeaveRequestNotFoundError,
// LeaveRequestNotCancellableError, ValidationError, plus the generic NotFoundError/
// BusinessRuleError bases) is already covered by app/hr/_lib/translate-hr-error.ts's
// instanceof chain — reused directly rather than re-implemented, per this module's own
// read-only-import allowance. `ActionResult<never>`'s failure branch is structurally
// `ActionResult<T>` for any T, so this thin re-export is enough; kept as a named local export
// so every app/employee-portal/actions.ts import stays scoped to this directory.
export function translateEmployeePortalError<T>(error: unknown): ActionResult<T> {
  return translateHrError(error);
}

export type { ActionResult };
