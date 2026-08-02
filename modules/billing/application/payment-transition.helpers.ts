// Pure, no "server-only" import — deliberately unit-testable in isolation, mirroring
// modules/payroll/application/salary-calculation.helpers.ts's own pattern.
import type { PaymentStatusValue } from "../domain/payment.entity";

// The Payment status transition table. CREATED and AUTHORIZED are both "in flight" — a real
// gateway may skip AUTHORIZED and settle straight to CAPTURED (most Indian rails, e.g. UPI,
// settle in one step), so CREATED -> CAPTURED is a legal direct transition, not only reachable
// via AUTHORIZED. FAILED and full REFUNDED are terminal — no further transition is legal from
// either. PARTIALLY_REFUNDED can only be reached from CAPTURED or from itself (multiple partial
// refunds accumulating over time) and can still resolve to a full REFUNDED later.
const ALLOWED_TRANSITIONS: Record<PaymentStatusValue, readonly PaymentStatusValue[]> = {
  CREATED: ["AUTHORIZED", "CAPTURED", "FAILED"],
  AUTHORIZED: ["CAPTURED", "FAILED"],
  CAPTURED: ["REFUNDED", "PARTIALLY_REFUNDED"],
  PARTIALLY_REFUNDED: ["REFUNDED", "PARTIALLY_REFUNDED"],
  FAILED: [],
  REFUNDED: [],
};

export function isValidPaymentTransition(from: PaymentStatusValue, to: PaymentStatusValue): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// Whether a Payment status is terminal — no further legal transition exists from it.
export function isTerminalPaymentStatus(status: PaymentStatusValue): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}
