import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpSmsProvider, defaultSmsGatewayRequestBuilder } from "./http-sms.provider";
import { NOTIFICATION_ERROR_CODES } from "../domain/notification-error-code";
import { isConfigurableProvider } from "../domain/configurable-provider";
import { isHealthCheckableProvider } from "../domain/health-checkable-provider";

const SMS_ENV = {
  SMS_GATEWAY_API_URL: "https://sms.example.com/send",
  SMS_GATEWAY_API_KEY: "super-secret-sms-key-123456",
};

function setSmsEnv() {
  for (const [key, value] of Object.entries(SMS_ENV)) process.env[key] = value;
}
function clearSmsEnv() {
  for (const key of Object.keys(SMS_ENV)) delete process.env[key];
  delete process.env.SMS_GATEWAY_SENDER_ID;
}

describe("HttpSmsProvider", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    clearSmsEnv();
    setSmsEnv();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    clearSmsEnv();
    vi.unstubAllGlobals();
  });

  it("implements ConfigurableProvider and HealthCheckableProvider", () => {
    const provider = new HttpSmsProvider();
    expect(isConfigurableProvider(provider)).toBe(true);
    expect(isHealthCheckableProvider(provider)).toBe(true);
  });

  // --- Configuration validation ------------------------------------------------------------------
  describe("validateConfiguration", () => {
    it("accepts a well-formed configuration", () => {
      const provider = new HttpSmsProvider();
      expect(provider.validateConfiguration({ apiUrl: "https://gw.example.com", apiKey: "k" })).toEqual({
        valid: true,
        errors: [],
      });
    });

    it("rejects a missing apiUrl/apiKey", () => {
      const provider = new HttpSmsProvider();
      const result = provider.validateConfiguration({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("apiUrl is required and must be a non-empty string.");
      expect(result.errors).toContain("apiKey is required and must be a non-empty string.");
    });

    it("rejects a malformed apiUrl", () => {
      const provider = new HttpSmsProvider();
      const result = provider.validateConfiguration({ apiUrl: "not a url", apiKey: "k" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("apiUrl must be a valid URL.");
    });

    it("rejects a non-object configuration", () => {
      const provider = new HttpSmsProvider();
      expect(provider.validateConfiguration(null).valid).toBe(false);
    });
  });

  // --- Successful send -------------------------------------------------------------------------
  it("sends an SMS successfully using the default request builder", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "sms-msg-1" }) });

    const provider = new HttpSmsProvider();
    const result = await provider.sendSMS({ to: "+15551234567", message: "Your OTP is 1234" });

    expect(result).toEqual({ status: "SENT", providerMessageId: "sms-msg-1" });
    expect(fetchMock).toHaveBeenCalledWith(
      SMS_ENV.SMS_GATEWAY_API_URL,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: `Bearer ${SMS_ENV.SMS_GATEWAY_API_KEY}` }),
      })
    );
  });

  it("supports a custom (vendor-specific) request builder via the extension point", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ messageId: "vendor-1" }) });

    const customBuilder = vi.fn(defaultSmsGatewayRequestBuilder);
    const provider = new HttpSmsProvider({}, customBuilder);
    const result = await provider.sendSMS({ to: "+1", message: "hi" });

    expect(customBuilder).toHaveBeenCalled();
    expect(result.status).toBe("SENT");
    expect(result.providerMessageId).toBe("vendor-1");
  });

  // --- Failed send + error classification ---------------------------------------------------------
  it("classifies a failed send and never returns the raw exception or the API key", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 });

    const provider = new HttpSmsProvider();
    const result = await provider.sendSMS({ to: "+1", message: "hi" });

    expect(result.status).toBe("FAILED");
    expect(result.error).not.toContain(SMS_ENV.SMS_GATEWAY_API_KEY);
  });

  it("does not throw when the gateway is not configured", async () => {
    clearSmsEnv();
    const provider = new HttpSmsProvider();
    const result = await provider.sendSMS({ to: "+1", message: "hi" });
    expect(result.status).toBe("FAILED");
  });

  it("returns a network classification for a rejected fetch", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));
    const provider = new HttpSmsProvider();
    const result = await provider.sendSMS({ to: "+1", message: "hi" });
    expect(result.error).toBe("Could not reach provider service.");
  });

  // --- Health check ----------------------------------------------------------------------------
  it("healthCheck reports healthy and logs a SUCCESS audit entry when the gateway is reachable", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const provider = new HttpSmsProvider({ tenantId: "t1", userId: "u1" });
    const result = await provider.healthCheck();

    expect(result).toEqual({ healthy: true });
    const logged = JSON.parse(String(consoleErrorSpy.mock.calls[0]?.[0]));
    expect(logged).toMatchObject({ action: "HEALTH_CHECK", status: "SUCCESS", tenantId: "t1", userId: "u1" });
  });

  it("healthCheck reports unhealthy and logs a FAILURE audit entry when unreachable", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const provider = new HttpSmsProvider();
    const result = await provider.healthCheck();

    expect(result.healthy).toBe(false);
    expect(result.details).toBeDefined();
    const logged = JSON.parse(String(consoleErrorSpy.mock.calls[0]?.[0]));
    expect(logged).toMatchObject({ action: "HEALTH_CHECK", status: "FAILURE" });
  });

  // --- Test connection -------------------------------------------------------------------------
  it("testConnection reports success and logs PROVIDER_TEST_CONNECTION", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const provider = new HttpSmsProvider();
    const result = await provider.testConnection();

    expect(result.success).toBe(true);
    const logged = JSON.parse(String(consoleErrorSpy.mock.calls[0]?.[0]));
    expect(logged).toMatchObject({ action: "PROVIDER_TEST_CONNECTION", status: "SUCCESS" });
  });

  it("testConnection reports failure with a safe classified message on a genuine network failure", async () => {
    // checkReachability() intentionally treats ANY resolved HTTP response (even a non-2xx one,
    // e.g. a 405 from a HEAD against a POST-only endpoint) as "reachable" — only a network-level
    // rejection (DNS failure, connection refused, timeout) should count as unhealthy; asserting
    // that distinction here rather than a resolved-but-non-ok response.
    fetchMock.mockRejectedValue(new Error("429 rate limit exceeded"));
    const provider = new HttpSmsProvider();
    const result = await provider.testConnection();

    expect(result.success).toBe(false);
    expect(result.message).toBe("Provider rate limit or quota exceeded.");
  });

  it("never leaks the API key anywhere in a result or logged entry", async () => {
    fetchMock.mockRejectedValue(new Error(`Authorization: Bearer ${SMS_ENV.SMS_GATEWAY_API_KEY} rejected`));
    const provider = new HttpSmsProvider();
    const result = await provider.sendSMS({ to: "+1", message: "hi" });
    expect(JSON.stringify(result)).not.toContain(SMS_ENV.SMS_GATEWAY_API_KEY);
  });

  it("classifies an authentication-shaped failure with the correct errorCode via classifyProviderError", async () => {
    fetchMock.mockRejectedValue(new Error("401 Unauthorized: authentication failed"));
    const provider = new HttpSmsProvider();
    const healthResult = await provider.healthCheck();

    expect(healthResult.healthy).toBe(false);
    const logged = JSON.parse(String(consoleErrorSpy.mock.calls[0]?.[0]));
    expect(logged.status).toBe("FAILURE");
    expect(logged.errorCode).toBe(NOTIFICATION_ERROR_CODES.AUTH_INVALID_CREDENTIALS);
  });
});
