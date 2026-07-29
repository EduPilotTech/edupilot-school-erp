import { BusinessRuleError, NotFoundError, ValidationError } from "@/lib/errors";

export class FeeCategoryNotFoundError extends NotFoundError {
  constructor() {
    super("Fee category not found.");
  }
}

export class FeeCategoryAlreadyExistsError extends BusinessRuleError {
  constructor() {
    super("A fee category with this code already exists.");
  }
}

export class FeeStructureNotFoundError extends NotFoundError {
  constructor() {
    super("Fee structure not found.");
  }
}

export class FeeStructureAlreadyExistsError extends BusinessRuleError {
  constructor() {
    super("A fee structure with this name already exists for this academic session.");
  }
}

export class FeeStructureItemNotFoundError extends NotFoundError {
  constructor() {
    super("Fee structure item not found.");
  }
}

export class FeeStructureItemAlreadyExistsError extends BusinessRuleError {
  constructor() {
    super("This class already has an amount configured for this fee category in this structure.");
  }
}

export class StudentFeeAssignmentNotFoundError extends NotFoundError {
  constructor() {
    super("This student has no fee assignment for this academic session.");
  }
}

export class InstallmentPlanNotFoundError extends NotFoundError {
  constructor() {
    super("Installment plan not found.");
  }
}

export class InvalidInstallmentPlanError extends ValidationError {
  constructor(message: string) {
    super(message);
  }
}

export class FineRuleNotFoundError extends NotFoundError {
  constructor() {
    super("Fine rule not found.");
  }
}

export class FeeConcessionNotFoundError extends NotFoundError {
  constructor() {
    super("Fee concession not found.");
  }
}

export class FeeInvoiceNotFoundError extends NotFoundError {
  constructor() {
    super("Fee invoice not found.");
  }
}

export class InvoiceAlreadyGeneratedError extends BusinessRuleError {
  constructor() {
    super("An invoice already exists for this student, fee item, and billing period.");
  }
}

export class InvoiceHasPaymentsError extends BusinessRuleError {
  constructor() {
    super("This invoice cannot be cancelled because a payment has already been recorded against it.");
  }
}

export class InvoiceNotCancellableError extends BusinessRuleError {
  constructor(message = "This invoice cannot be cancelled in its current status.") {
    super(message);
  }
}

export class FeePaymentNotFoundError extends NotFoundError {
  constructor() {
    super("Fee payment not found.");
  }
}

export class OverpaymentError extends BusinessRuleError {
  constructor() {
    super("The payment amount exceeds the total outstanding balance of the selected invoices.");
  }
}

export class PaymentAlreadyReversedError extends BusinessRuleError {
  constructor() {
    super("This payment has already been reversed.");
  }
}

export class PaymentNotReversibleError extends BusinessRuleError {
  constructor(message = "This payment cannot be reversed in its current status.") {
    super(message);
  }
}
