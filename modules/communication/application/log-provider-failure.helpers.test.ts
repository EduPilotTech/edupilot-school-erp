import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logProviderFailure } from "./log-provider-failure.helpers";
import { NOTIFICATION_ERROR_CODES, NOTIFICATION_ERROR_MESSAGES } from "../domain/notification-error-code";

describe("logProviderFailure", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const baseInput = {
    channel: "EMAIL" as const,
    tenantId: "11111111-1111-1111-1111-111111111111",
    notificationId: "22222222-2222-2222-2222-222222222222",
    provider: "sendgrid",
  };

  it("uses classifyProviderError to derive errorCode and safeMessage", () => {
    const entry = logProviderFailure({
      ...baseInput,
      rawError: new Error("The access token has expired."),
    });
    expect(entry.errorCode).toBe(NOTIFICATION_ERROR_CODES.AUTH_EXPIRED_TOKEN);
    expect(entry.safeMessage).toBe(NOTIFICATION_ERROR_MESSAGES.AUTH_EXPIRED_TOKEN);
  });

  it("uses redactSecrets so the redactedError field never contains a raw secret", () => {
    const entry = logProviderFailure({
      ...baseInput,
      rawError: new Error("Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.abc.def failed with API_KEY=abcdef123456789"),
    });
    expect(entry.redactedError).toContain("Authorization: Bearer ********");
    expect(entry.redactedError).toContain("API_KEY=********");
    expect(entry.redactedError).not.toContain("eyJhbGciOiJIUzI1NiJ9");
    expect(entry.redactedError).not.toContain("abcdef123456789");
  });

  it("produces a structured entry containing exactly the approved fields", () => {
    const entry = logProviderFailure({
      ...baseInput,
      rawError: new Error("503 Service Unavailable"),
      metadata: { requestId: "req-123" },
    });

    expect(entry).toMatchObject({
      channel: "EMAIL",
      provider: "sendgrid",
      tenantId: baseInput.tenantId,
      notificationId: baseInput.notificationId,
      errorCode: NOTIFICATION_ERROR_CODES.PROVIDER_UNAVAILABLE,
      safeMessage: NOTIFICATION_ERROR_MESSAGES.PROVIDER_UNAVAILABLE,
      requestId: "req-123",
    });
    expect(typeof entry.timestamp).toBe("string");
    expect(() => new Date(entry.timestamp).toISOString()).not.toThrow();
    expect(typeof entry.redactedError).toBe("string");
  });

  it("masks a secret present in the raw error before it reaches the log entry or the console sink", () => {
    const secret = "sk_live_51H_super_secret_value_should_never_appear";
    const entry = logProviderFailure({
      ...baseInput,
      rawError: new Error(`API_KEY=${secret} rejected`),
    });

    expect(entry.redactedError).not.toContain(secret);
    expect(JSON.stringify(entry)).not.toContain(secret);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const loggedLine = String(consoleErrorSpy.mock.calls[0]?.[0]);
    expect(loggedLine).not.toContain(secret);
  });

  it("writes a single structured JSON line to console.error", () => {
    logProviderFailure({ ...baseInput, rawError: new Error("some failure") });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const loggedLine = String(consoleErrorSpy.mock.calls[0]?.[0]);
    expect(() => JSON.parse(loggedLine)).not.toThrow();
    const parsed = JSON.parse(loggedLine);
    expect(parsed.channel).toBe("EMAIL");
    expect(parsed.provider).toBe("sendgrid");
  });

  it("includes safe, non-sensitive metadata (tenantId, notificationId, channel, provider) unredacted", () => {
    const entry = logProviderFailure({ ...baseInput, rawError: new Error("some failure") });
    expect(entry.tenantId).toBe(baseInput.tenantId);
    expect(entry.notificationId).toBe(baseInput.notificationId);
    expect(entry.channel).toBe(baseInput.channel);
    expect(entry.provider).toBe(baseInput.provider);
  });

  it("omits requestId entirely when no metadata is supplied", () => {
    const entry = logProviderFailure({ ...baseInput, rawError: new Error("some failure") });
    expect(entry.requestId).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(entry, "requestId")).toBe(false);
  });

  it("omits requestId when metadata is supplied but requestId is absent", () => {
    const entry = logProviderFailure({ ...baseInput, rawError: new Error("some failure"), metadata: {} });
    expect(entry.requestId).toBeUndefined();
  });

  it("falls back to SYSTEM_UNKNOWN_ERROR for an unrecognized exception, without throwing", () => {
    const entry = logProviderFailure({
      ...baseInput,
      rawError: new Error("Something bizarre and unforeseen happened."),
    });
    expect(entry.errorCode).toBe(NOTIFICATION_ERROR_CODES.SYSTEM_UNKNOWN_ERROR);
    expect(entry.safeMessage).toBe(NOTIFICATION_ERROR_MESSAGES.SYSTEM_UNKNOWN_ERROR);
  });

  it("handles a null rawError without throwing, classifying as SYSTEM_UNKNOWN_ERROR", () => {
    expect(() => logProviderFailure({ ...baseInput, rawError: null })).not.toThrow();
    const entry = logProviderFailure({ ...baseInput, rawError: null });
    expect(entry.errorCode).toBe(NOTIFICATION_ERROR_CODES.SYSTEM_UNKNOWN_ERROR);
    expect(entry.redactedError).toBe("null");
  });

  it("handles an undefined rawError without throwing", () => {
    expect(() => logProviderFailure({ ...baseInput, rawError: undefined })).not.toThrow();
  });

  it("handles a plain string rawError", () => {
    const entry = logProviderFailure({ ...baseInput, rawError: "connect ECONNREFUSED 127.0.0.1:443" });
    expect(entry.errorCode).toBe(NOTIFICATION_ERROR_CODES.NETWORK_UNREACHABLE);
    expect(entry.redactedError).toBe("connect ECONNREFUSED 127.0.0.1:443");
  });

  it("handles a non-Error object rawError without throwing", () => {
    expect(() => logProviderFailure({ ...baseInput, rawError: { weird: "shape", nested: { a: 1 } } })).not.toThrow();
    const entry = logProviderFailure({ ...baseInput, rawError: { weird: "shape", nested: { a: 1 } } });
    expect(entry.errorCode).toBe(NOTIFICATION_ERROR_CODES.SYSTEM_UNKNOWN_ERROR);
  });

  it("handles a circular-reference rawError without throwing", () => {
    const circular: Record<string, unknown> = { message: "circular failure" };
    circular.self = circular;
    expect(() => logProviderFailure({ ...baseInput, rawError: circular })).not.toThrow();
  });

  it("works across every channel value", () => {
    for (const channel of ["IN_APP", "EMAIL", "SMS", "WHATSAPP", "PUSH"] as const) {
      const entry = logProviderFailure({ ...baseInput, channel, rawError: new Error("failure") });
      expect(entry.channel).toBe(channel);
    }
  });
});
