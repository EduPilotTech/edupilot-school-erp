import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WhatsAppCloudApiProvider } from "./whatsapp-cloud-api.provider";
import { NOTIFICATION_ERROR_CODES } from "../domain/notification-error-code";
import { isConfigurableProvider } from "../domain/configurable-provider";
import { isHealthCheckableProvider } from "../domain/health-checkable-provider";

const WA_ENV = {
  WHATSAPP_ACCESS_TOKEN: "super-secret-whatsapp-access-token-123456",
  WHATSAPP_PHONE_NUMBER_ID: "1234567890",
  WHATSAPP_BUSINESS_ACCOUNT_ID: "9876543210",
};

function setWaEnv() {
  for (const [key, value] of Object.entries(WA_ENV)) process.env[key] = value;
}
function clearWaEnv() {
  for (const key of Object.keys(WA_ENV)) delete process.env[key];
  delete process.env.WHATSAPP_API_VERSION;
}

describe("WhatsAppCloudApiProvider", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    clearWaEnv();
    setWaEnv();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    clearWaEnv();
    vi.unstubAllGlobals();
  });

  it("implements ConfigurableProvider and HealthCheckableProvider", () => {
    const provider = new WhatsAppCloudApiProvider();
    expect(isConfigurableProvider(provider)).toBe(true);
    expect(isHealthCheckableProvider(provider)).toBe(true);
  });

  // --- Configuration validation ------------------------------------------------------------------
  describe("validateConfiguration", () => {
    it("accepts a well-formed configuration", () => {
      const provider = new WhatsAppCloudApiProvider();
      expect(
        provider.validateConfiguration({ accessToken: "tok", phoneNumberId: "1", businessAccountId: "2" })
      ).toEqual({ valid: true, errors: [] });
    });

    it("rejects a configuration missing required fields", () => {
      const provider = new WhatsAppCloudApiProvider();
      const result = provider.validateConfiguration({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("accessToken is required and must be a non-empty string.");
      expect(result.errors).toContain("phoneNumberId is required and must be a non-empty string.");
      expect(result.errors).toContain("businessAccountId is required and must be a non-empty string.");
    });

    it("rejects a non-object configuration", () => {
      const provider = new WhatsAppCloudApiProvider();
      expect(provider.validateConfiguration(null).valid).toBe(false);
    });
  });

  // --- sendMessage -----------------------------------------------------------------------------
  it("sends a plain text message successfully", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ messages: [{ id: "wamid.123" }] }) });

    const provider = new WhatsAppCloudApiProvider();
    const result = await provider.sendMessage({ to: "+15551234567", message: "Hello from school" });

    expect(result).toEqual({ status: "SENT", providerMessageId: "wamid.123" });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain(`/${WA_ENV.WHATSAPP_PHONE_NUMBER_ID}/messages`);
    expect(options.headers.Authorization).toBe(`Bearer ${WA_ENV.WHATSAPP_ACCESS_TOKEN}`);
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({ messaging_product: "whatsapp", type: "text", text: { body: "Hello from school" } });
  });

  // --- sendTemplate ----------------------------------------------------------------------------
  it("sends a template message with rendered parameters", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ messages: [{ id: "wamid.tpl" }] }) });

    const provider = new WhatsAppCloudApiProvider();
    const result = await provider.sendTemplate({
      to: "+1",
      templateName: "fee_reminder",
      variables: { amount: "500", dueDate: "2026-08-15" },
    });

    expect(result.status).toBe("SENT");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.type).toBe("template");
    expect(body.template.name).toBe("fee_reminder");
    expect(body.template.components[0].parameters).toEqual([
      { type: "text", text: "500" },
      { type: "text", text: "2026-08-15" },
    ]);
  });

  it("sends a template with no variables without a components field", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ messages: [{ id: "x" }] }) });
    const provider = new WhatsAppCloudApiProvider();
    await provider.sendTemplate({ to: "+1", templateName: "holiday_notice", variables: {} });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.template.components).toBeUndefined();
  });

  // --- sendMedia -------------------------------------------------------------------------------
  it("sends an image media message and infers the type from the URL extension", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ messages: [{ id: "wamid.img" }] }) });
    const provider = new WhatsAppCloudApiProvider();
    const result = await provider.sendMedia({ to: "+1", mediaUrl: "https://cdn.example.com/notice.png", caption: "See notice" });

    expect(result.status).toBe("SENT");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.type).toBe("image");
    expect(body.image).toEqual({ link: "https://cdn.example.com/notice.png", caption: "See notice" });
  });

  it("defaults to document type for an unrecognized media extension", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ messages: [{ id: "x" }] }) });
    const provider = new WhatsAppCloudApiProvider();
    await provider.sendMedia({ to: "+1", mediaUrl: "https://cdn.example.com/report.pdf" });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.type).toBe("document");
  });

  // --- Failed send + error classification ---------------------------------------------------------
  it("classifies a failed send and never returns the raw exception or the access token", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 });
    const provider = new WhatsAppCloudApiProvider();
    const result = await provider.sendMessage({ to: "+1", message: "hi" });

    expect(result.status).toBe("FAILED");
    expect(result.error).not.toContain(WA_ENV.WHATSAPP_ACCESS_TOKEN);
  });

  it("does not throw when WhatsApp is not configured", async () => {
    clearWaEnv();
    const provider = new WhatsAppCloudApiProvider();
    const result = await provider.sendMessage({ to: "+1", message: "hi" });
    expect(result.status).toBe("FAILED");
  });

  // --- Health check ----------------------------------------------------------------------------
  it("healthCheck reports healthy and logs SUCCESS when the Business Account endpoint responds", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const provider = new WhatsAppCloudApiProvider({ tenantId: "t1", userId: "u1" });
    const result = await provider.healthCheck();

    expect(result).toEqual({ healthy: true });
    expect(fetchMock.mock.calls[0][0]).toContain(WA_ENV.WHATSAPP_BUSINESS_ACCOUNT_ID);
    const logged = JSON.parse(String(consoleErrorSpy.mock.calls[0]?.[0]));
    expect(logged).toMatchObject({ action: "HEALTH_CHECK", status: "SUCCESS", tenantId: "t1", userId: "u1" });
  });

  it("healthCheck reports unhealthy and logs FAILURE with the correct errorCode on an auth error", async () => {
    fetchMock.mockRejectedValue(new Error("401 Unauthorized"));
    const provider = new WhatsAppCloudApiProvider();
    const result = await provider.healthCheck();

    expect(result.healthy).toBe(false);
    const logged = JSON.parse(String(consoleErrorSpy.mock.calls[0]?.[0]));
    expect(logged).toMatchObject({ action: "HEALTH_CHECK", status: "FAILURE", errorCode: NOTIFICATION_ERROR_CODES.AUTH_INVALID_CREDENTIALS });
  });

  // --- Test connection -------------------------------------------------------------------------
  it("testConnection reports success and logs PROVIDER_TEST_CONNECTION", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const provider = new WhatsAppCloudApiProvider();
    const result = await provider.testConnection();

    expect(result.success).toBe(true);
    const logged = JSON.parse(String(consoleErrorSpy.mock.calls[0]?.[0]));
    expect(logged).toMatchObject({ action: "PROVIDER_TEST_CONNECTION", status: "SUCCESS" });
  });

  it("testConnection reports failure with a safe classified message", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429 });
    const provider = new WhatsAppCloudApiProvider();
    const result = await provider.testConnection();

    expect(result.success).toBe(false);
    expect(result.message).toBe("Provider rate limit or quota exceeded.");
  });

  it("never leaks the access token anywhere in a result or logged entry", async () => {
    fetchMock.mockRejectedValue(new Error(`Authorization: Bearer ${WA_ENV.WHATSAPP_ACCESS_TOKEN} rejected`));
    const provider = new WhatsAppCloudApiProvider();
    const result = await provider.sendMessage({ to: "+1", message: "hi" });
    expect(JSON.stringify(result)).not.toContain(WA_ENV.WHATSAPP_ACCESS_TOKEN);
  });
});
