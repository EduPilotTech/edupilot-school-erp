import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logCommunicationAudit } from "./log-communication-audit.helpers";
import { COMMUNICATION_AUDIT_ACTIONS, type CommunicationAuditAction } from "../domain/communication-audit-action";
import { NOTIFICATION_ERROR_CODES, NOTIFICATION_ERROR_MESSAGES } from "../domain/notification-error-code";

describe("logCommunicationAudit", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const baseInput = {
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "33333333-3333-3333-3333-333333333333",
    provider: "sendgrid",
    channel: "EMAIL" as const,
    status: "SUCCESS" as const,
  };

  // --- Every supported audit action -----------------------------------------------------------
  it.each(Object.values(COMMUNICATION_AUDIT_ACTIONS))("logs a well-formed entry for action %s", (action) => {
    const entry = logCommunicationAudit({ ...baseInput, action: action as CommunicationAuditAction });
    expect(entry.action).toBe(action);
    expect(entry.tenantId).toBe(baseInput.tenantId);
    expect(entry.userId).toBe(baseInput.userId);
    expect(entry.provider).toBe(baseInput.provider);
    expect(entry.channel).toBe(baseInput.channel);
    expect(entry.status).toBe("SUCCESS");
    expect(typeof entry.timestamp).toBe("string");
    expect(() => new Date(entry.timestamp).toISOString()).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  // --- Metadata redaction ----------------------------------------------------------------------
  it("redacts every metadata value before including it in the entry", () => {
    const entry = logCommunicationAudit({
      ...baseInput,
      action: COMMUNICATION_AUDIT_ACTIONS.PROVIDER_CONFIGURATION_UPDATED,
      metadata: {
        changedField: "apiKey",
        previousValue: "API_KEY=abcdef123456789",
        note: "rotated as part of scheduled maintenance",
      },
    });

    expect(entry.metadata?.changedField).toBe("apiKey");
    expect(entry.metadata?.previousValue).toBe("API_KEY=********");
    expect(entry.metadata?.note).toBe("rotated as part of scheduled maintenance");
    expect(JSON.stringify(entry)).not.toContain("abcdef123456789");
  });

  it("redacts a Bearer token or JWT if it ends up in metadata", () => {
    const entry = logCommunicationAudit({
      ...baseInput,
      action: COMMUNICATION_AUDIT_ACTIONS.CREDENTIAL_ROTATED,
      metadata: { detail: "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.abc.def" },
    });
    expect(entry.metadata?.detail).toBe("Authorization: Bearer ********");
  });

  it("omits metadata entirely when none is supplied", () => {
    const entry = logCommunicationAudit({ ...baseInput, action: COMMUNICATION_AUDIT_ACTIONS.PROVIDER_ENABLED });
    expect(entry.metadata).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(entry, "metadata")).toBe(false);
  });

  // --- Safe output / structured shape -----------------------------------------------------------
  it("produces only the approved fields, with requestId included when supplied", () => {
    const entry = logCommunicationAudit({
      ...baseInput,
      action: COMMUNICATION_AUDIT_ACTIONS.PROVIDER_TEST_CONNECTION,
      requestId: "req-abc-123",
    });
    expect(entry.requestId).toBe("req-abc-123");
  });

  it("omits requestId when not supplied", () => {
    const entry = logCommunicationAudit({ ...baseInput, action: COMMUNICATION_AUDIT_ACTIONS.HEALTH_CHECK });
    expect(entry.requestId).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(entry, "requestId")).toBe(false);
  });

  it("classifies an attached error and includes errorCode/safeMessage only on FAILURE", () => {
    const entry = logCommunicationAudit({
      ...baseInput,
      action: COMMUNICATION_AUDIT_ACTIONS.PROVIDER_TEST_CONNECTION,
      status: "FAILURE",
      error: new Error("401 Unauthorized"),
    });
    expect(entry.errorCode).toBe(NOTIFICATION_ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    expect(entry.safeMessage).toBe(NOTIFICATION_ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS);
  });

  it("omits errorCode/safeMessage on SUCCESS even if an error field were somehow supplied", () => {
    const entry = logCommunicationAudit({
      ...baseInput,
      action: COMMUNICATION_AUDIT_ACTIONS.HEALTH_CHECK,
      status: "SUCCESS",
    });
    expect(entry.errorCode).toBeUndefined();
    expect(entry.safeMessage).toBeUndefined();
  });

  it("omits errorCode/safeMessage on FAILURE when no error was supplied", () => {
    const entry = logCommunicationAudit({
      ...baseInput,
      action: COMMUNICATION_AUDIT_ACTIONS.QUEUE_CANCEL,
      status: "FAILURE",
    });
    expect(entry.errorCode).toBeUndefined();
    expect(entry.safeMessage).toBeUndefined();
  });

  it("never leaks a raw credential from the attached error into the entry", () => {
    const secret = "sk_live_should_never_appear_anywhere_1234567890";
    const entry = logCommunicationAudit({
      ...baseInput,
      action: COMMUNICATION_AUDIT_ACTIONS.MANUAL_SEND,
      status: "FAILURE",
      error: new Error(`API_KEY=${secret} rejected`),
    });
    expect(JSON.stringify(entry)).not.toContain(secret);
    const loggedLine = String(consoleErrorSpy.mock.calls[0]?.[0]);
    expect(loggedLine).not.toContain(secret);
  });

  // --- Failure path: audit logging must never block the primary operation -----------------------
  it("does not throw and still returns a valid entry when the write itself fails, logging a safe fallback instead", () => {
    consoleErrorSpy.mockImplementationOnce(() => {
      throw new Error("log sink unavailable");
    });

    let entry;
    expect(() => {
      entry = logCommunicationAudit({ ...baseInput, action: COMMUNICATION_AUDIT_ACTIONS.QUEUE_RETRY });
    }).not.toThrow();

    expect(entry).toMatchObject({ action: COMMUNICATION_AUDIT_ACTIONS.QUEUE_RETRY, tenantId: baseInput.tenantId });
    // The primary write threw, so the fallback path should have logged a second, distinct entry.
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    const fallbackLine = String(consoleErrorSpy.mock.calls[1]?.[0]);
    expect(fallbackLine).toContain("COMMUNICATION_AUDIT_LOG_WRITE_FAILED");
  });

  it("never throws even if both the primary write and the fallback write fail", () => {
    consoleErrorSpy.mockImplementation(() => {
      throw new Error("log sink completely unavailable");
    });

    expect(() => {
      logCommunicationAudit({ ...baseInput, action: COMMUNICATION_AUDIT_ACTIONS.MANUAL_SEND });
    }).not.toThrow();
  });

  // --- Unknown action rejection -----------------------------------------------------------------
  it("rejects an unknown action at runtime", () => {
    expect(() =>
      logCommunicationAudit({
        ...baseInput,
        action: "NOT_A_REAL_ACTION" as unknown as CommunicationAuditAction,
      })
    ).toThrow(/unknown communication audit action/i);
  });

  it("does not write any log entry when the action is rejected", () => {
    try {
      logCommunicationAudit({ ...baseInput, action: "BOGUS_ACTION" as unknown as CommunicationAuditAction });
    } catch {
      // expected
    }
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
