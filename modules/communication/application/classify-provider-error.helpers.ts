import { NOTIFICATION_ERROR_CODES, NOTIFICATION_ERROR_MESSAGES, type NotificationErrorCode } from "../domain/notification-error-code";
import type { NotificationChannelValue } from "../domain/notification-delivery.entity";

export interface ClassifiedProviderError {
  errorCode: NotificationErrorCode;
  safeMessage: string;
}

// Deliberately pure — no "server-only", no Prisma, no I/O — so it's trivially unit-testable and
// so nothing in the send/dispatch path can accidentally skip classification. This is Phase 15B
// Milestone M1's whole job: turn an arbitrary provider exception into one of the standard,
// catalogued codes, WITHOUT ever returning any of the raw exception's own text. The caller (a
// future real provider's catch block, Milestone M8+) is responsible for logging the raw `rawError`
// server-side (Milestone M3, redacted per Milestone M2) — this function never sees or needs that
// logging concern; its only job is classification.
//
// `channel` is accepted now for future channel-specific refinement once real provider SDKs exist
// (e.g. a WhatsApp-specific error shape might warrant its own pattern) — today's matching is
// deliberately channel-agnostic, since no real SDK exists yet to characterize a channel-specific
// error shape from. Unused today; kept in the signature so no future milestone needs to change it.
export function classifyProviderError(
  rawError: unknown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for future channel-specific classification, see comment above.
  channel: NotificationChannelValue
): ClassifiedProviderError {
  const errorCode = determineErrorCode(rawError);
  return { errorCode, safeMessage: NOTIFICATION_ERROR_MESSAGES[errorCode] };
}

function determineErrorCode(rawError: unknown): NotificationErrorCode {
  const message = extractMessage(rawError);
  if (message === null) {
    // Not an Error instance and no string message could be extracted at all (e.g. `null`,
    // `undefined`, a plain non-Error object with no `message` string) — nothing to pattern-match
    // against, so this is the mandatory fallback per the Error Handling Review's own rule.
    return NOTIFICATION_ERROR_CODES.SYSTEM_UNKNOWN_ERROR;
  }

  const text = message.toLowerCase();

  // Order matters: more specific patterns are checked before more general ones (e.g. "token
  // expired" before a bare "auth" match) so a message matching multiple patterns still lands on
  // the most precise code available.
  if (text.includes("not configured")) return NOTIFICATION_ERROR_CODES.AUTH_NOT_CONFIGURED;
  if (text.includes("expired") && text.includes("token")) return NOTIFICATION_ERROR_CODES.AUTH_EXPIRED_TOKEN;
  if (
    text.includes("unauthorized") ||
    text.includes("invalid credentials") ||
    text.includes("invalid api key") ||
    text.includes("authentication failed") ||
    text.includes("401")
  ) {
    return NOTIFICATION_ERROR_CODES.AUTH_INVALID_CREDENTIALS;
  }

  if (text.includes("rate limit") || text.includes("quota") || text.includes("429")) {
    return NOTIFICATION_ERROR_CODES.PROVIDER_QUOTA_EXCEEDED;
  }

  if (text.includes("timeout") || text.includes("timed out")) {
    return NOTIFICATION_ERROR_CODES.NETWORK_TIMEOUT;
  }
  if (
    text.includes("econnrefused") ||
    text.includes("enotfound") ||
    text.includes("network") ||
    text.includes("could not reach") ||
    text.includes("unreachable")
  ) {
    return NOTIFICATION_ERROR_CODES.NETWORK_UNREACHABLE;
  }

  if (
    text.includes("invalid recipient") ||
    text.includes("invalid phone") ||
    text.includes("invalid email") ||
    text.includes("no email") ||
    text.includes("no phone") ||
    text.includes("recipient is unreachable") ||
    text.includes("recipient has no")
  ) {
    return NOTIFICATION_ERROR_CODES.RECIPIENT_INVALID;
  }
  if (text.includes("blocked") || text.includes("opted out") || text.includes("bounced")) {
    return NOTIFICATION_ERROR_CODES.RECIPIENT_BLOCKED;
  }

  if (text.includes("template")) return NOTIFICATION_ERROR_CODES.MESSAGE_INVALID_TEMPLATE;
  if (text.includes("spam") || text.includes("content rejected") || text.includes("content policy")) {
    return NOTIFICATION_ERROR_CODES.MESSAGE_CONTENT_REJECTED;
  }

  if (text.includes("max retries") || text.includes("maximum retry") || text.includes("retry limit")) {
    return NOTIFICATION_ERROR_CODES.QUEUE_MAX_RETRIES_EXCEEDED;
  }

  if (
    text.includes("unavailable") ||
    text.includes("service down") ||
    text.includes("500") ||
    text.includes("502") ||
    text.includes("503")
  ) {
    return NOTIFICATION_ERROR_CODES.PROVIDER_UNAVAILABLE;
  }
  if (text.includes("rejected")) return NOTIFICATION_ERROR_CODES.PROVIDER_REJECTED;

  // A message existed but matched none of the known patterns above — still classified, never
  // returned raw, but genuinely unrecognized. The mandatory fallback.
  return NOTIFICATION_ERROR_CODES.SYSTEM_UNKNOWN_ERROR;
}

// Extracts a plain string message to pattern-match against, without ever returning it to a
// caller — only `determineErrorCode` (in this same file) ever sees this text, and it's discarded
// the moment classification is done. Returns `null` when there's genuinely nothing to work with.
function extractMessage(rawError: unknown): string | null {
  if (rawError instanceof Error) return rawError.message;
  if (typeof rawError === "string") return rawError;
  if (
    typeof rawError === "object" &&
    rawError !== null &&
    "message" in rawError &&
    typeof (rawError as { message: unknown }).message === "string"
  ) {
    return (rawError as { message: string }).message;
  }
  return null;
}
