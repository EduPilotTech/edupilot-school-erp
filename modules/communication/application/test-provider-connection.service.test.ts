import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  smtpTestConnection,
  smsTestConnection,
  whatsappTestConnection,
  isSmtpConfiguredMock,
  isSmsGatewayConfiguredMock,
  isWhatsAppConfiguredMock,
} = vi.hoisted(() => ({
  smtpTestConnection: vi.fn(),
  smsTestConnection: vi.fn(),
  whatsappTestConnection: vi.fn(),
  isSmtpConfiguredMock: vi.fn(),
  isSmsGatewayConfiguredMock: vi.fn(),
  isWhatsAppConfiguredMock: vi.fn(),
}));

// Constructor functions (not arrow functions) — `new SmtpEmailProvider()` etc. requires something
// callable with `new`, which an arrow function can never be.
vi.mock("../infrastructure/smtp-email.provider", () => ({
  SmtpEmailProvider: vi.fn(function SmtpEmailProvider(this: { testConnection: typeof smtpTestConnection }) {
    this.testConnection = smtpTestConnection;
  }),
}));
vi.mock("../infrastructure/smtp-env", () => ({ isSmtpConfigured: isSmtpConfiguredMock }));
vi.mock("../infrastructure/http-sms.provider", () => ({
  HttpSmsProvider: vi.fn(function HttpSmsProvider(this: { testConnection: typeof smsTestConnection }) {
    this.testConnection = smsTestConnection;
  }),
}));
vi.mock("../infrastructure/sms-env", () => ({ isSmsGatewayConfigured: isSmsGatewayConfiguredMock }));
vi.mock("../infrastructure/whatsapp-cloud-api.provider", () => ({
  WhatsAppCloudApiProvider: vi.fn(function WhatsAppCloudApiProvider(this: { testConnection: typeof whatsappTestConnection }) {
    this.testConnection = whatsappTestConnection;
  }),
}));
vi.mock("../infrastructure/whatsapp-env", () => ({ isWhatsAppConfigured: isWhatsAppConfiguredMock }));

import {
  testEmailProviderConnection,
  testSmsProviderConnection,
  testWhatsAppProviderConnection,
} from "./test-provider-connection.service";

const context = { tenantId: "tenant-1", actingUserId: "user-1" };

describe("test-provider-connection.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("testEmailProviderConnection delegates to SmtpEmailProvider.testConnection when SMTP is configured", async () => {
    isSmtpConfiguredMock.mockReturnValue(true);
    smtpTestConnection.mockResolvedValue({ success: true, message: "ok" });

    const result = await testEmailProviderConnection(context);
    expect(result).toEqual({ success: true, message: "ok" });
    expect(smtpTestConnection).toHaveBeenCalledTimes(1);
  });

  it("testEmailProviderConnection returns a not-configured result without touching the provider when SMTP isn't configured", async () => {
    isSmtpConfiguredMock.mockReturnValue(false);
    const result = await testEmailProviderConnection(context);
    expect(result.success).toBe(false);
    expect(result.message).toContain("not configured");
    expect(smtpTestConnection).not.toHaveBeenCalled();
  });

  it("testSmsProviderConnection delegates to HttpSmsProvider.testConnection when configured", async () => {
    isSmsGatewayConfiguredMock.mockReturnValue(true);
    smsTestConnection.mockResolvedValue({ success: true, message: "ok" });

    const result = await testSmsProviderConnection(context);
    expect(result.success).toBe(true);
    expect(smsTestConnection).toHaveBeenCalledTimes(1);
  });

  it("testSmsProviderConnection returns not-configured when the gateway isn't configured", async () => {
    isSmsGatewayConfiguredMock.mockReturnValue(false);
    const result = await testSmsProviderConnection(context);
    expect(result.success).toBe(false);
    expect(smsTestConnection).not.toHaveBeenCalled();
  });

  it("testWhatsAppProviderConnection delegates to WhatsAppCloudApiProvider.testConnection when configured", async () => {
    isWhatsAppConfiguredMock.mockReturnValue(true);
    whatsappTestConnection.mockResolvedValue({ success: false, message: "Provider authentication failed." });

    const result = await testWhatsAppProviderConnection(context);
    expect(result).toEqual({ success: false, message: "Provider authentication failed." });
    expect(whatsappTestConnection).toHaveBeenCalledTimes(1);
  });

  it("testWhatsAppProviderConnection returns not-configured when WhatsApp isn't configured", async () => {
    isWhatsAppConfiguredMock.mockReturnValue(false);
    const result = await testWhatsAppProviderConnection(context);
    expect(result.success).toBe(false);
    expect(whatsappTestConnection).not.toHaveBeenCalled();
  });
});
