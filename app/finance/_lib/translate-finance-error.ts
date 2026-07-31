import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import {
  FinanceAccountNotFoundError,
  FinanceAccountAlreadyExistsError,
  IncomeCategoryNotFoundError,
  IncomeCategoryAlreadyExistsError,
  ExpenseCategoryNotFoundError,
  ExpenseCategoryAlreadyExistsError,
  IncomeNotFoundError,
  ExpenseNotFoundError,
  InsufficientAccountBalanceError,
  InvalidFinanceOperationError,
} from "@/modules/finance/domain/errors";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// instanceof-only, matching translate-hr-error.ts's / translate-payroll-error.ts's exact
// precedent (docs/CODING_STANDARDS.md §5). Unexpected errors are rethrown, never swallowed.
export function translateFinanceError(error: unknown): ActionResult<never> {
  if (error instanceof FinanceAccountAlreadyExistsError) {
    return { success: false, error: { code: "FINANCE_ACCOUNT_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof FinanceAccountNotFoundError) {
    return { success: false, error: { code: "FINANCE_ACCOUNT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof IncomeCategoryAlreadyExistsError) {
    return { success: false, error: { code: "INCOME_CATEGORY_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof IncomeCategoryNotFoundError) {
    return { success: false, error: { code: "INCOME_CATEGORY_NOT_FOUND", message: error.message } };
  }
  if (error instanceof ExpenseCategoryAlreadyExistsError) {
    return { success: false, error: { code: "EXPENSE_CATEGORY_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof ExpenseCategoryNotFoundError) {
    return { success: false, error: { code: "EXPENSE_CATEGORY_NOT_FOUND", message: error.message } };
  }
  if (error instanceof IncomeNotFoundError) {
    return { success: false, error: { code: "INCOME_NOT_FOUND", message: error.message } };
  }
  if (error instanceof ExpenseNotFoundError) {
    return { success: false, error: { code: "EXPENSE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof InsufficientAccountBalanceError) {
    return { success: false, error: { code: "INSUFFICIENT_ACCOUNT_BALANCE", message: error.message } };
  }
  if (error instanceof InvalidFinanceOperationError) {
    return { success: false, error: { code: "INVALID_FINANCE_OPERATION", message: error.message } };
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
