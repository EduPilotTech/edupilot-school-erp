// Phase 15B Milestone M4 — the interim Communication Audit Logging helper approved in the Error
// Handling Review. No `CommunicationAuditLog` table exists yet (that needs a migration — out of
// scope here); this writes a structured, redacted entry through the same secure logging
// foundation Milestone M3 already built, so nothing about credential handling is reinvented.
//
// Deliberately has NO "server-only" marker, for the same reason as classify-provider-error and
// redact-secrets and log-provider-failure (Milestones M1-M3): no server-exclusive dependency, and
// must stay directly unit-testable per this codebase's own convention (see log-provider-failure
// .helpers.ts's own comment).
import { classifyProviderError } from "./classify-provider-error.helpers";
import { redactSecrets } from "./redact-secrets.helpers";
import { COMMUNICATION_AUDIT_ACTIONS, type CommunicationAuditAction, type CommunicationAuditStatus } from "../domain/communication-audit-action";
import type { NotificationChannelValue } from "../domain/notification-delivery.entity";
import type { NotificationErrorCode } from "../domain/notification-error-code";

// A flat, string-valued bag only — same reasoning as LogProviderFailureMetadata (Milestone M3):
// every value is redacted unconditionally before it's ever included in the entry, so a careless
// caller can never smuggle a raw credential through as "just metadata."
export type CommunicationAuditMetadata = Record<string, string>;

export interface LogCommunicationAuditInput {
  tenantId: string;
  userId: string;
  action: CommunicationAuditAction;
  provider: string;
  // Every supported audit action concerns a specific channel's provider (Email/SMS/WhatsApp), or
  // — for Queue Retry/Cancel/Manual Send, which describe a notification rather than a provider
  // directly — the notification's own primary channel. Callers with no meaningful channel
  // context may pass "IN_APP" as a safe default rather than omitting it.
  channel: NotificationChannelValue;
  status: CommunicationAuditStatus;
  // The raw underlying error, only meaningful when `status` is "FAILURE" — classified via
  // classifyProviderError() (Milestone M1), never stored or logged raw. Optional: some FAILURE
  // events (e.g. a rejected Provider Disabled action) may have no single exception to attach.
  error?: unknown;
  metadata?: CommunicationAuditMetadata;
  requestId?: string;
}

export interface CommunicationAuditLogEntry {
  timestamp: string;
  tenantId: string;
  userId: string;
  action: CommunicationAuditAction;
  provider: string;
  channel: NotificationChannelValue;
  status: CommunicationAuditStatus;
  errorCode?: NotificationErrorCode;
  safeMessage?: string;
  metadata?: Record<string, string>;
  requestId?: string;
}

const KNOWN_ACTIONS = new Set<string>(Object.values(COMMUNICATION_AUDIT_ACTIONS));

function assertKnownAuditAction(action: CommunicationAuditAction): void {
  if (!KNOWN_ACTIONS.has(action)) {
    throw new Error(`Unknown communication audit action: "${String(action)}".`);
  }
}

function redactMetadata(metadata: CommunicationAuditMetadata | undefined): Record<string, string> | undefined {
  if (!metadata) return undefined;
  return Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, redactSecrets(String(value))]));
}

function buildEntry(input: LogCommunicationAuditInput): CommunicationAuditLogEntry {
  const classified = input.status === "FAILURE" && input.error !== undefined ? classifyProviderError(input.error, input.channel) : undefined;
  const redactedMetadata = redactMetadata(input.metadata);

  return {
    timestamp: new Date().toISOString(),
    tenantId: input.tenantId,
    userId: input.userId,
    action: input.action,
    provider: input.provider,
    channel: input.channel,
    status: input.status,
    ...(classified ? { errorCode: classified.errorCode, safeMessage: classified.safeMessage } : {}),
    ...(redactedMetadata ? { metadata: redactedMetadata } : {}),
    ...(input.requestId ? { requestId: input.requestId } : {}),
  };
}

function stringifyForFallback(value: unknown): string {
  if (value instanceof Error) return value.message;
  try {
    return String(value);
  } catch {
    return "Unserializable value.";
  }
}

// Always classifies an attached error first (when one exists), always redacts metadata before
// logging, never exposes a raw credential. Audit logging must NEVER block the primary operation
// it describes: the only step that can genuinely fail at runtime (writing the entry) is wrapped
// so a write failure is caught, a minimal safe fallback is logged instead, and the already-built
// entry is still returned to the caller — execution always continues.
//
// This deliberately does NOT call logProviderFailure() for its own write-failure fallback: that
// function's contract requires a `notificationId`, which most audit actions here (e.g. "Provider
// Enabled") have no meaningful value for — forcing one in would misuse its contract rather than
// reuse it. redactSecrets() is reused directly instead, which is the actual shared logic both
// functions depend on.
export function logCommunicationAudit(input: LogCommunicationAuditInput): CommunicationAuditLogEntry {
  assertKnownAuditAction(input.action);

  const entry = buildEntry(input);

  try {
    console.error(JSON.stringify(entry));
  } catch (writeError) {
    try {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          event: "COMMUNICATION_AUDIT_LOG_WRITE_FAILED",
          action: input.action,
          tenantId: input.tenantId,
          reason: redactSecrets(stringifyForFallback(writeError)),
        })
      );
    } catch {
      // Even the fallback failed to serialize — give up silently. The primary operation this
      // audit entry was describing must never be blocked by a logging failure, no matter how deep.
    }
  }

  return entry;
}
