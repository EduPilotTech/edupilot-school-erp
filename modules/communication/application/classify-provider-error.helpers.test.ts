import { describe, expect, it } from "vitest";
import { classifyProviderError } from "./classify-provider-error.helpers";
import { NOTIFICATION_ERROR_CODES, NOTIFICATION_ERROR_MESSAGES } from "../domain/notification-error-code";

describe("classifyProviderError", () => {
  // --- Authentication ---------------------------------------------------------------------
  it("classifies a 'not configured' message as AUTH_NOT_CONFIGURED", () => {
    const result = classifyProviderError(new Error("Email provider is not configured for this tenant."), "EMAIL");
    expect(result.errorCode).toBe(NOTIFICATION_ERROR_CODES.AUTH_NOT_CONFIGURED);
    expect(result.safeMessage).toBe(NOTIFICATION_ERROR_MESSAGES.AUTH_NOT_CONFIGURED);
  });

  it("classifies an expired-token message as AUTH_EXPIRED_TOKEN", () => {
    const result = classifyProviderError(new Error("The access token has expired."), "WHATSAPP");
    expect(result.errorCode).toBe(NOTIFICATION_ERROR_CODES.AUTH_EXPIRED_TOKEN);
  });

  it("classifies an unauthorized/invalid-credentials message as AUTH_INVALID_CREDENTIALS", () => {
    expect(classifyProviderError(new Error("401 Unauthorized"), "EMAIL").errorCode).toBe(
      NOTIFICATION_ERROR_CODES.AUTH_INVALID_CREDENTIALS
    );
    expect(classifyProviderError(new Error("Invalid API key provided"), "SMS").errorCode).toBe(
      NOTIFICATION_ERROR_CODES.AUTH_INVALID_CREDENTIALS
    );
  });

  // --- Recipient ----------------------------------------------------------------------------
  it("classifies an invalid-recipient message as RECIPIENT_INVALID", () => {
    expect(classifyProviderError(new Error("Invalid phone number supplied."), "SMS").errorCode).toBe(
      NOTIFICATION_ERROR_CODES.RECIPIENT_INVALID
    );
    expect(classifyProviderError(new Error("Recipient has no email address on file."), "EMAIL").errorCode).toBe(
      NOTIFICATION_ERROR_CODES.RECIPIENT_INVALID
    );
  });

  it("classifies a blocked/opted-out message as RECIPIENT_BLOCKED", () => {
    expect(classifyProviderError(new Error("This recipient has opted out."), "WHATSAPP").errorCode).toBe(
      NOTIFICATION_ERROR_CODES.RECIPIENT_BLOCKED
    );
    expect(classifyProviderError(new Error("Message bounced."), "EMAIL").errorCode).toBe(
      NOTIFICATION_ERROR_CODES.RECIPIENT_BLOCKED
    );
  });

  // --- Provider -----------------------------------------------------------------------------
  it("classifies a service-unavailable message as PROVIDER_UNAVAILABLE", () => {
    expect(classifyProviderError(new Error("503 Service Unavailable"), "EMAIL").errorCode).toBe(
      NOTIFICATION_ERROR_CODES.PROVIDER_UNAVAILABLE
    );
  });

  it("classifies a generic rejection as PROVIDER_REJECTED", () => {
    expect(classifyProviderError(new Error("The message was rejected by the upstream server."), "SMS").errorCode).toBe(
      NOTIFICATION_ERROR_CODES.PROVIDER_REJECTED
    );
  });

  it("classifies a rate-limit/quota message as PROVIDER_QUOTA_EXCEEDED", () => {
    expect(classifyProviderError(new Error("429 Too Many Requests — rate limit exceeded"), "WHATSAPP").errorCode).toBe(
      NOTIFICATION_ERROR_CODES.PROVIDER_QUOTA_EXCEEDED
    );
  });

  // --- Queue --------------------------------------------------------------------------------
  it("classifies a max-retries message as QUEUE_MAX_RETRIES_EXCEEDED", () => {
    expect(classifyProviderError(new Error("Maximum retry attempts reached."), "EMAIL").errorCode).toBe(
      NOTIFICATION_ERROR_CODES.QUEUE_MAX_RETRIES_EXCEEDED
    );
  });

  // --- Network ------------------------------------------------------------------------------
  it("classifies a timeout message as NETWORK_TIMEOUT", () => {
    expect(classifyProviderError(new Error("Request timed out after 30s."), "SMS").errorCode).toBe(
      NOTIFICATION_ERROR_CODES.NETWORK_TIMEOUT
    );
  });

  it("classifies a connection failure as NETWORK_UNREACHABLE", () => {
    expect(classifyProviderError(new Error("connect ECONNREFUSED 127.0.0.1:443"), "EMAIL").errorCode).toBe(
      NOTIFICATION_ERROR_CODES.NETWORK_UNREACHABLE
    );
  });

  // --- Message ------------------------------------------------------------------------------
  it("classifies a template rendering failure as MESSAGE_INVALID_TEMPLATE", () => {
    expect(classifyProviderError(new Error("The requested template does not exist."), "WHATSAPP").errorCode).toBe(
      NOTIFICATION_ERROR_CODES.MESSAGE_INVALID_TEMPLATE
    );
  });

  it("classifies a spam/content-policy rejection as MESSAGE_CONTENT_REJECTED", () => {
    expect(classifyProviderError(new Error("Message flagged as spam by content policy."), "EMAIL").errorCode).toBe(
      NOTIFICATION_ERROR_CODES.MESSAGE_CONTENT_REJECTED
    );
  });

  // --- System / fallback behavior ------------------------------------------------------------
  it("falls back to SYSTEM_UNKNOWN_ERROR for a message matching no known pattern", () => {
    const result = classifyProviderError(new Error("Something bizarre and unforeseen happened."), "EMAIL");
    expect(result.errorCode).toBe(NOTIFICATION_ERROR_CODES.SYSTEM_UNKNOWN_ERROR);
    expect(result.safeMessage).toBe(NOTIFICATION_ERROR_MESSAGES.SYSTEM_UNKNOWN_ERROR);
  });

  it("falls back to SYSTEM_UNKNOWN_ERROR for a non-Error thrown value (string)", () => {
    expect(classifyProviderError("just a plain string, not an Error", "SMS").errorCode).toBe(
      NOTIFICATION_ERROR_CODES.SYSTEM_UNKNOWN_ERROR
    );
  });

  it("falls back to SYSTEM_UNKNOWN_ERROR for null", () => {
    expect(classifyProviderError(null, "EMAIL").errorCode).toBe(NOTIFICATION_ERROR_CODES.SYSTEM_UNKNOWN_ERROR);
  });

  it("falls back to SYSTEM_UNKNOWN_ERROR for undefined", () => {
    expect(classifyProviderError(undefined, "WHATSAPP").errorCode).toBe(NOTIFICATION_ERROR_CODES.SYSTEM_UNKNOWN_ERROR);
  });

  it("falls back to SYSTEM_UNKNOWN_ERROR for a plain object with no message field", () => {
    expect(classifyProviderError({ code: 42 }, "SMS").errorCode).toBe(NOTIFICATION_ERROR_CODES.SYSTEM_UNKNOWN_ERROR);
  });

  it("classifies a plain object WITH a string message field using the same rules as an Error", () => {
    const result = classifyProviderError({ message: "Invalid API key provided" }, "EMAIL");
    expect(result.errorCode).toBe(NOTIFICATION_ERROR_CODES.AUTH_INVALID_CREDENTIALS);
  });

  // --- Never expose raw provider exceptions --------------------------------------------------
  it("never includes any part of the raw error's message in the returned result", () => {
    const rawMessage = "SECRET_SENTINEL_VALUE_should_never_leak_into_output_12345";
    const result = classifyProviderError(new Error(rawMessage), "EMAIL");
    expect(result.errorCode).not.toContain(rawMessage);
    expect(result.safeMessage).not.toContain(rawMessage);
    expect(JSON.stringify(result)).not.toContain(rawMessage);
  });

  it("always returns a code that exists in the standard catalogue and a corresponding safe message", () => {
    const result = classifyProviderError(new Error("anything at all"), "IN_APP");
    expect(Object.values(NOTIFICATION_ERROR_CODES)).toContain(result.errorCode);
    expect(result.safeMessage).toBe(NOTIFICATION_ERROR_MESSAGES[result.errorCode]);
  });
});
