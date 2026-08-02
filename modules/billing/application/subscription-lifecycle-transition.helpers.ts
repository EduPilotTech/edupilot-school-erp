// Pure, no "server-only" import — deliberately unit-testable in isolation, mirroring
// payment-transition.helpers.ts's exact shape.
import type { SubscriptionStatusValue } from "../domain/subscription.entity";

// The Subscription lifecycle status transition table — for `updateLifecycleStatus`/
// `transitionSubscriptionStatus` SPECIFICALLY (the daily background jobs' TRIALING/ACTIVE/
// PAST_DUE/EXPIRED transitions), not for the subscription lifecycle as a WHOLE:
//
//   TRIALING   -> ACTIVE, EXPIRED
//   ACTIVE     -> PAST_DUE, CANCELED
//   PAST_DUE   -> ACTIVE, EXPIRED, CANCELED
//   EXPIRED    -> (terminal — reviving an expired subscription happens via a brand-new
//                  Subscription row through createSubscription's own close-then-create renewal
//                  path, already built in Bundle B's subscription.charged webhook handler, NOT by
//                  flipping an EXPIRED row back to ACTIVE in place)
//   CANCELED   -> (terminal — same reasoning, a cancelled tenant resubscribing gets a new
//                  Subscription row via createSubscription)
//
// EXPIRED and CANCELED are dead-ends for `updateLifecycleStatus` specifically — not for the
// subscription lifecycle as a whole, which can continue via a new row.
const ALLOWED_TRANSITIONS: Record<SubscriptionStatusValue, readonly SubscriptionStatusValue[]> = {
  TRIALING: ["ACTIVE", "EXPIRED"],
  ACTIVE: ["PAST_DUE", "CANCELED"],
  PAST_DUE: ["ACTIVE", "EXPIRED", "CANCELED"],
  EXPIRED: [],
  CANCELED: [],
};

export function isValidLifecycleTransition(from: SubscriptionStatusValue, to: SubscriptionStatusValue): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// Whether a Subscription lifecycle status is terminal — no further legal transition exists from
// it via `updateLifecycleStatus` (a new Subscription row is always the way forward from here).
export function isTerminalLifecycleStatus(status: SubscriptionStatusValue): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}
