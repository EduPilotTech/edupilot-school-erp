// Bundle B — Webhook security primitives. Pure functions with ZERO imports besides Node's
// built-in `crypto`, deliberately kept out of any file that also imports Prisma so this module
// stays trivially unit-testable and has no accidental dependency surface. This is the sole trust
// boundary for anything a Razorpay webhook claims — get it right.

import { createHash, createHmac, timingSafeEqual } from "crypto";

// Compares two hex-encoded digests in constant time. Returns false immediately (without calling
// `timingSafeEqual`) when the lengths differ — timingSafeEqual throws on unequal-length buffers,
// and a thrown exception here must never become an unhandled error on a webhook request path.
function timingSafeHexEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}

// Verifies the `X-Razorpay-Signature` header Razorpay attaches to every webhook delivery:
// HMAC-SHA256(rawBody, webhookSecret), hex-encoded. `rawBody` MUST be the exact, unparsed
// request body bytes (as a string) — signing is computed over the raw bytes, so re-serializing a
// parsed JSON object before verifying would produce a different digest and always fail.
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string
): boolean {
  const expectedSignature = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return timingSafeHexEqual(expectedSignature, signatureHeader);
}

const DEFAULT_MAX_AGE_SECONDS = 300;
const CLOCK_SKEW_ALLOWANCE_SECONDS = 60;

// Defense-in-depth replay-protection HEURISTIC — NOT a cryptographic guarantee, and not a
// substitute for verifyWebhookSignature. It only narrows the window during which a captured,
// validly-signed request could be usefully replayed. Two caveats to keep in mind wherever this
// is called:
//   1. Razorpay's own retry/redelivery mechanism can legitimately redeliver a webhook well after
//      this window (e.g. after an outage), so a `false` here is NOT proof of a replay attack.
//   2. The actual safety net against a genuine replay (including a legitimate-but-late
//      redelivery) is DB-level idempotency on the derived event key — a separate, later piece of
//      work, not this function. This function exists only to narrow the window, not to close it.
export function isWebhookTimestampFresh(
  payloadCreatedAtUnixSeconds: number,
  asOf: Date,
  maxAgeSeconds: number = DEFAULT_MAX_AGE_SECONDS
): boolean {
  const asOfUnixSeconds = asOf.getTime() / 1000;
  const ageSeconds = asOfUnixSeconds - payloadCreatedAtUnixSeconds;

  // A payload claiming to be from the future (beyond a small clock-skew allowance) is itself
  // suspicious — reject it rather than treating a negative age as "very fresh".
  if (ageSeconds < -CLOCK_SKEW_ALLOWANCE_SECONDS) {
    return false;
  }

  return ageSeconds <= maxAgeSeconds;
}

// Razorpay does not always provide a clean, canonical event id in the JSON body the way some
// providers do. When the `X-Razorpay-Event-Id` header is present, it is used as-is — Razorpay
// guarantees this header is stable across redeliveries of the same event, so using it directly
// gives true idempotency with no derivation needed.
//
// When the header is absent, a deterministic fallback key is derived by hashing
// {gatewayProvider, eventType, payload} together. This is deterministic (the exact same
// redelivered payload always derives the exact same key), but NOT a perfect substitute for a
// real event id: two genuinely different events with byte-identical payloads (e.g. two
// back-to-back webhooks for the exact same amount/status with no other differentiator) would
// collide and be treated as one. This is accepted as a known limitation of the fallback — in
// practice Razorpay's actual payloads always differ by at least a payment/order id or timestamp
// field, so a true collision is not expected to occur with real traffic.
export function deriveWebhookIdempotencyKey(
  gatewayProvider: string,
  headerEventId: string | null,
  eventType: string,
  payload: unknown
): string {
  if (headerEventId) {
    return headerEventId;
  }

  return createHash("sha256")
    .update(JSON.stringify({ gatewayProvider, eventType, payload }))
    .digest("hex");
}
