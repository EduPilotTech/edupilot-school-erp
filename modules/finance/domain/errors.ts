import { BusinessRuleError, NotFoundError } from "@/lib/errors";

// --- FinanceAccount (Cash/Bank ledger) -------------------------------------------------------

export class FinanceAccountNotFoundError extends NotFoundError {
  constructor(message = "Finance account not found.") {
    super(message);
  }
}

export class FinanceAccountAlreadyExistsError extends BusinessRuleError {
  constructor(message = "A finance account with this name already exists.") {
    super(message);
  }
}

// --- IncomeCategory / ExpenseCategory (lookup tables) ----------------------------------------

export class IncomeCategoryNotFoundError extends NotFoundError {
  constructor(message = "Income category not found.") {
    super(message);
  }
}

export class IncomeCategoryAlreadyExistsError extends BusinessRuleError {
  constructor(message = "An income category with this code already exists.") {
    super(message);
  }
}

export class ExpenseCategoryNotFoundError extends NotFoundError {
  constructor(message = "Expense category not found.") {
    super(message);
  }
}

export class ExpenseCategoryAlreadyExistsError extends BusinessRuleError {
  constructor(message = "An expense category with this code already exists.") {
    super(message);
  }
}

// --- Income / Expense (transactional entries) ------------------------------------------------

export class IncomeNotFoundError extends NotFoundError {
  constructor(message = "Income entry not found.") {
    super(message);
  }
}

export class ExpenseNotFoundError extends NotFoundError {
  constructor(message = "Expense entry not found.") {
    super(message);
  }
}

// Reserved for a future/optional balance-sufficiency guard on Expense recording — this simple
// cash/bank ledger deliberately does not enforce non-negative balances today (a school may
// legitimately record an expense before the matching deposit clears), so this is not currently
// thrown anywhere; it exists so callers/UI have a stable type to check against if that guard is
// added later.
export class InsufficientAccountBalanceError extends BusinessRuleError {
  constructor(message = "This account does not have sufficient balance for this operation.") {
    super(message);
  }
}

// General-purpose invalid-operation error for this module — e.g. an Income/Expense entry
// referencing an academic session that does not exist for this tenant (modules/finance
// intentionally does not own an AcademicSessionNotFoundError of its own; that model belongs to
// modules/academics).
export class InvalidFinanceOperationError extends BusinessRuleError {
  constructor(message: string) {
    super(message);
  }
}
