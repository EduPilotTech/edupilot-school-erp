import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import {
  SubscriptionPlanDefinitionNotFoundError,
  SubscriptionPlanDefinitionAlreadyExistsError,
  SubscriptionPlanDefinitionInactiveError,
  PlanFeatureEntitlementNotFoundError,
  PlanFeatureEntitlementAlreadyExistsError,
  SubscriptionNotFoundError,
  TenantHasNoSubscriptionError,
  InvalidSubscriptionAssignmentError,
  SubscriptionAlreadyCancelledError,
  SubscriptionNotCancellableError,
  SubscriptionInvoiceNotFoundError,
  SubscriptionInvoiceAlreadyExistsError,
  InvalidInvoiceStatusTransitionError,
  PaymentNotFoundError,
  DuplicateGatewayOrderError,
  InvalidPaymentTransitionError,
  RefundExceedsPaymentAmountError,
  BillingRunNotFoundError,
  BillingRunAlreadyExistsError,
  BillingRunNotDraftError,
  BillingRunNotProcessedError,
  BillingRunLockedError,
  WebhookSignatureInvalidError,
  LicenseInvalidError,
  FeatureNotEntitledError,
  InvalidLifecycleTransitionError,
  SchoolSuspendedError,
  SchoolStatusUnchangedError,
} from "@/modules/billing/domain/errors";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Shared by every app/billing/**/actions.ts file — instanceof-only, matching
// translateHostelError.ts's/translatePayrollError.ts's own precedent (docs/CODING_STANDARDS.md
// §5). Every named subclass in modules/billing/domain/errors.ts gets its own branch, most
// specific first; unexpected errors are rethrown, never swallowed.
export function translateBillingError(error: unknown): ActionResult<never> {
  if (error instanceof SubscriptionPlanDefinitionAlreadyExistsError) {
    return { success: false, error: { code: "SUBSCRIPTION_PLAN_DEFINITION_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof SubscriptionPlanDefinitionInactiveError) {
    return { success: false, error: { code: "SUBSCRIPTION_PLAN_DEFINITION_INACTIVE", message: error.message } };
  }
  if (error instanceof SubscriptionPlanDefinitionNotFoundError) {
    return { success: false, error: { code: "SUBSCRIPTION_PLAN_DEFINITION_NOT_FOUND", message: error.message } };
  }
  if (error instanceof PlanFeatureEntitlementAlreadyExistsError) {
    return { success: false, error: { code: "PLAN_FEATURE_ENTITLEMENT_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof PlanFeatureEntitlementNotFoundError) {
    return { success: false, error: { code: "PLAN_FEATURE_ENTITLEMENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof TenantHasNoSubscriptionError) {
    return { success: false, error: { code: "TENANT_HAS_NO_SUBSCRIPTION", message: error.message } };
  }
  if (error instanceof InvalidSubscriptionAssignmentError) {
    return { success: false, error: { code: "INVALID_SUBSCRIPTION_ASSIGNMENT", message: error.message } };
  }
  if (error instanceof SubscriptionAlreadyCancelledError) {
    return { success: false, error: { code: "SUBSCRIPTION_ALREADY_CANCELLED", message: error.message } };
  }
  if (error instanceof SubscriptionNotCancellableError) {
    return { success: false, error: { code: "SUBSCRIPTION_NOT_CANCELLABLE", message: error.message } };
  }
  if (error instanceof SubscriptionNotFoundError) {
    return { success: false, error: { code: "SUBSCRIPTION_NOT_FOUND", message: error.message } };
  }
  if (error instanceof SubscriptionInvoiceAlreadyExistsError) {
    return { success: false, error: { code: "SUBSCRIPTION_INVOICE_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof InvalidInvoiceStatusTransitionError) {
    return { success: false, error: { code: "INVALID_INVOICE_STATUS_TRANSITION", message: error.message } };
  }
  if (error instanceof SubscriptionInvoiceNotFoundError) {
    return { success: false, error: { code: "SUBSCRIPTION_INVOICE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof DuplicateGatewayOrderError) {
    return { success: false, error: { code: "DUPLICATE_GATEWAY_ORDER", message: error.message } };
  }
  if (error instanceof InvalidPaymentTransitionError) {
    return { success: false, error: { code: "INVALID_PAYMENT_TRANSITION", message: error.message } };
  }
  if (error instanceof RefundExceedsPaymentAmountError) {
    return { success: false, error: { code: "REFUND_EXCEEDS_PAYMENT_AMOUNT", message: error.message } };
  }
  if (error instanceof PaymentNotFoundError) {
    return { success: false, error: { code: "PAYMENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof BillingRunAlreadyExistsError) {
    return { success: false, error: { code: "BILLING_RUN_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof BillingRunNotDraftError) {
    return { success: false, error: { code: "BILLING_RUN_NOT_DRAFT", message: error.message } };
  }
  if (error instanceof BillingRunNotProcessedError) {
    return { success: false, error: { code: "BILLING_RUN_NOT_PROCESSED", message: error.message } };
  }
  if (error instanceof BillingRunLockedError) {
    return { success: false, error: { code: "BILLING_RUN_LOCKED", message: error.message } };
  }
  if (error instanceof BillingRunNotFoundError) {
    return { success: false, error: { code: "BILLING_RUN_NOT_FOUND", message: error.message } };
  }
  if (error instanceof WebhookSignatureInvalidError) {
    return { success: false, error: { code: "WEBHOOK_SIGNATURE_INVALID", message: error.message } };
  }
  if (error instanceof LicenseInvalidError) {
    return { success: false, error: { code: "LICENSE_INVALID", message: error.message } };
  }
  if (error instanceof FeatureNotEntitledError) {
    return { success: false, error: { code: "FEATURE_NOT_ENTITLED", message: error.message } };
  }
  if (error instanceof InvalidLifecycleTransitionError) {
    return { success: false, error: { code: "INVALID_LIFECYCLE_TRANSITION", message: error.message } };
  }
  if (error instanceof SchoolSuspendedError) {
    return { success: false, error: { code: "SCHOOL_SUSPENDED", message: error.message } };
  }
  if (error instanceof SchoolStatusUnchangedError) {
    return { success: false, error: { code: "SCHOOL_STATUS_UNCHANGED", message: error.message } };
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
