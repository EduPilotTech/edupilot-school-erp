// Phase 15B Milestone M3 — the secure server-side communication logging helper approved in the
// Error Handling Review. This is the SINGLE logging entry point every future real Email/SMS/
// WhatsApp provider (Milestone M8+) must call from its catch block — never console.error a raw
// exception directly, always go through this.
//
// Flow: raw provider exception -> classifyProviderError() [Milestone M1] -> redactSecrets()
// [Milestone M2] -> one structured log entry. This file does not reimplement classification or
// redaction logic — it only composes the two.
//
// Deliberately has NO "server-only" marker: unlike a Prisma-backed repository/service, this
// helper has no server-exclusive dependency (its only side effect is a console write) and must
// remain directly unit-testable, matching classify-provider-error.helpers.ts's and
// redact-secrets.helpers.ts's own precedent from Milestones M1/M2 — this codebase's established
// convention is that "server-only" application services are verified live, not via this test
// runner (see vitest.config.ts's own comment), which would make this helper untestable if marked
// that way.
import { classifyProviderError } from "./classify-provider-error.helpers";
import { redactSecrets } from "./redact-secrets.helpers";
import type { NotificationChannelValue } from "../domain/notification-delivery.entity";
import type { NotificationErrorCode } from "../domain/notification-error-code";

// Only `requestId` is named as an allowed pass-through field in the approved log structure —
// deliberately NOT a generic `Record<string, unknown>` bag, so a careless future caller can never
// smuggle an arbitrary (possibly sensitive) metadata value into the log through this input.
export interface LogProviderFailureMetadata {
  requestId?: string;
}

export interface LogProviderFailureInput {
  channel: NotificationChannelValue;
  tenantId: string;
  notificationId: string;
  provider: string;
  rawError: unknown;
  metadata?: LogProviderFailureMetadata;
}

// Exactly the fields the Error Handling Review's Server Logging Policy allows — nothing else is
// ever added here. `redactedError` is the closest thing to "raw" this entry ever contains, and
// even that has already been through redactSecrets().
export interface ProviderFailureLogEntry {
  timestamp: string;
  channel: NotificationChannelValue;
  provider: string;
  tenantId: string;
  notificationId: string;
  errorCode: NotificationErrorCode;
  safeMessage: string;
  redactedError: string;
  requestId?: string;
}

// Converts an arbitrary caught value into a single string worth redacting and logging — a
// distinct concern from classifyProviderError()'s own, much narrower message extraction (which
// only needs enough text to pattern-match a category, and deliberately never returns it to a
// caller). This one intentionally prefers a full stack trace when available, since a server log
// is exactly where that extra detail belongs (never in `safeMessage`, never in the database).
function stringifyRawError(rawError: unknown): string {
  if (rawError instanceof Error) {
    // `Error.stack` already includes the message as its own first line — using it alone (when
    // present) avoids logging the message twice.
    return rawError.stack ?? rawError.message;
  }
  if (typeof rawError === "string") return rawError;
  if (rawError === null || rawError === undefined) return String(rawError);
  try {
    return JSON.stringify(rawError);
  } catch {
    // A circular reference or other non-serializable shape — still must not throw; still must
    // not silently produce an empty log entry.
    return "Unserializable error value.";
  }
}

// Always classifies first, always redacts before logging, never exposes a raw exception —
// returns the structured entry (in addition to writing it to the log sink) so callers, and this
// file's own tests, can assert on exactly what was logged without needing to spy on console
// output formatting.
export function logProviderFailure(input: LogProviderFailureInput): ProviderFailureLogEntry {
  const classified = classifyProviderError(input.rawError, input.channel);
  const redactedError = redactSecrets(stringifyRawError(input.rawError));

  const entry: ProviderFailureLogEntry = {
    timestamp: new Date().toISOString(),
    channel: input.channel,
    provider: input.provider,
    tenantId: input.tenantId,
    notificationId: input.notificationId,
    errorCode: classified.errorCode,
    safeMessage: classified.safeMessage,
    redactedError,
    ...(input.metadata?.requestId ? { requestId: input.metadata.requestId } : {}),
  };

  // This IS the logging sink; no observability platform is wired in yet (see the Error Handling
  // Review's own note that this codebase has no centralized structured logger). A single JSON
  // line is the standard, aggregator-friendly shape.
  console.error(JSON.stringify(entry));

  return entry;
}
