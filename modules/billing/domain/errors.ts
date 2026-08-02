import { BusinessRuleError, NotFoundError, ValidationError } from "@/lib/errors";

// Mirrors modules/payroll/domain/errors.ts's exact style — every billing-specific failure is a
// named subclass of one of the three base error types in @/lib/errors, never a bare Error or a
// string-matched message.

// --- Subscription Plan Definition (public catalog) ----------------------------------------------

export class SubscriptionPlanDefinitionNotFoundError extends NotFoundError {
  constructor(message = "Subscription plan not found.") {
    super(message);
  }
}

export class SubscriptionPlanDefinitionAlreadyExistsError extends BusinessRuleError {
  constructor(message = "A subscription plan with this plan code already exists.") {
    super(message);
  }
}

export class SubscriptionPlanDefinitionInactiveError extends BusinessRuleError {
  constructor(message = "This subscription plan is no longer active and cannot be assigned.") {
    super(message);
  }
}

// --- Plan Feature Entitlement ---------------------------------------------------------------------

export class PlanFeatureEntitlementNotFoundError extends NotFoundError {
  constructor(message = "Plan feature entitlement not found.") {
    super(message);
  }
}

export class PlanFeatureEntitlementAlreadyExistsError extends BusinessRuleError {
  constructor(message = "An entitlement for this feature key already exists on this plan.") {
    super(message);
  }
}

// --- Subscription ------------------------------------------------------------------------------

export class SubscriptionNotFoundError extends NotFoundError {
  constructor(message = "Subscription not found.") {
    super(message);
  }
}

export class TenantHasNoSubscriptionError extends BusinessRuleError {
  constructor(message = "This tenant has no current subscription.") {
    super(message);
  }
}

export class InvalidSubscriptionAssignmentError extends ValidationError {
  constructor(message: string) {
    super(message);
  }
}

export class SubscriptionAlreadyCancelledError extends BusinessRuleError {
  constructor(message = "This subscription has already been cancelled.") {
    super(message);
  }
}

export class SubscriptionNotCancellableError extends BusinessRuleError {
  constructor(message = "This subscription is not in a cancellable state.") {
    super(message);
  }
}

// --- Subscription Invoice -----------------------------------------------------------------------

export class SubscriptionInvoiceNotFoundError extends NotFoundError {
  constructor(message = "Subscription invoice not found.") {
    super(message);
  }
}

export class SubscriptionInvoiceAlreadyExistsError extends BusinessRuleError {
  constructor(message = "An invoice has already been generated for this subscription and billing period.") {
    super(message);
  }
}

export class InvalidInvoiceStatusTransitionError extends BusinessRuleError {
  constructor(message: string) {
    super(message);
  }
}

// --- Payment -------------------------------------------------------------------------------------

export class PaymentNotFoundError extends NotFoundError {
  constructor(message = "Payment not found.") {
    super(message);
  }
}

export class DuplicateGatewayOrderError extends BusinessRuleError {
  constructor(message = "A payment for this gateway order already exists.") {
    super(message);
  }
}

export class InvalidPaymentTransitionError extends BusinessRuleError {
  constructor(message: string) {
    super(message);
  }
}

export class RefundExceedsPaymentAmountError extends ValidationError {
  constructor(message = "The refund amount cannot exceed the amount still available to refund on this payment.") {
    super(message);
  }
}

// --- Billing Run -----------------------------------------------------------------------------------

export class BillingRunNotFoundError extends NotFoundError {
  constructor(message = "Billing run not found.") {
    super(message);
  }
}

export class BillingRunAlreadyExistsError extends BusinessRuleError {
  constructor(message = "A billing run already exists for this billing period.") {
    super(message);
  }
}

export class BillingRunNotDraftError extends BusinessRuleError {
  constructor(message = "This billing run has already been processed and cannot be processed again.") {
    super(message);
  }
}

export class BillingRunNotProcessedError extends BusinessRuleError {
  constructor(message = "This billing run must be processed before it can be locked.") {
    super(message);
  }
}

export class BillingRunLockedError extends BusinessRuleError {
  constructor(message = "This billing run is locked and can no longer be modified.") {
    super(message);
  }
}

// --- Webhook Event ---------------------------------------------------------------------------------

export class WebhookSignatureInvalidError extends ValidationError {
  constructor(message = "The webhook signature could not be verified.") {
    super(message);
  }
}

// --- License / Entitlement --------------------------------------------------------------------------

export class LicenseInvalidError extends BusinessRuleError {
  constructor(message = "This tenant's subscription does not permit access to the application.") {
    super(message);
  }
}

export class FeatureNotEntitledError extends BusinessRuleError {
  constructor(message = "The current subscription plan does not include this feature.") {
    super(message);
  }
}

// --- Subscription Lifecycle / Tenant Access / School Suspension (Phase 16, Bundle D) -------------

export class InvalidLifecycleTransitionError extends BusinessRuleError {
  constructor(message: string) {
    super(message);
  }
}

export class SchoolSuspendedError extends BusinessRuleError {
  constructor(message = "This school's account has been suspended. Contact support to reactivate.") {
    super(message);
  }
}

// Thrown by school-activation.service.ts when a suspend/activate call would be a silent no-op
// (the tenant is already in the requested state) — a signal, not a silent swallow, mirroring
// SubscriptionAlreadyCancelledError's own "don't silently no-op" reasoning.
export class SchoolStatusUnchangedError extends BusinessRuleError {
  constructor(message: string) {
    super(message);
  }
}
