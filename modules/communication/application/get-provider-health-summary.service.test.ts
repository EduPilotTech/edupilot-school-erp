import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  smtpHealthCheck,
  smsHealthCheck,
  whatsappHealthCheck,
  isSmtpConfiguredMock,
  isSmsGatewayConfiguredMock,
  isWhatsAppConfiguredMock,
} = vi.hoisted(() => ({
  smtpHealthCheck: vi.fn(),
  smsHealthCheck: vi.fn(),
  whatsappHealthCheck: vi.fn(),
  isSmtpConfiguredMock: vi.fn(),
  isSmsGatewayConfiguredMock: vi.fn(),
  isWhatsAppConfiguredMock: vi.fn(),
}));

// Constructor functions (not arrow functions) — `new SmtpEmailProvider()` etc. requires something
// callable with `new`, which an arrow function can never be.
vi.mock("../infrastructure/smtp-email.provider", () => ({
  SmtpEmailProvider: vi.fn(function SmtpEmailProvider(this: { healthCheck: typeof smtpHealthCheck }) {
    this.healthCheck = smtpHealthCheck;
  }),
}));
vi.mock("../infrastructure/smtp-env", () => ({ isSmtpConfigured: isSmtpConfiguredMock }));
vi.mock("../infrastructure/http-sms.provider", () => ({
  HttpSmsProvider: vi.fn(function HttpSmsProvider(this: { healthCheck: typeof smsHealthCheck }) {
    this.healthCheck = smsHealthCheck;
  }),
}));
vi.mock("../infrastructure/sms-env", () => ({ isSmsGatewayConfigured: isSmsGatewayConfiguredMock }));
vi.mock("../infrastructure/whatsapp-cloud-api.provider", () => ({
  WhatsAppCloudApiProvider: vi.fn(function WhatsAppCloudApiProvider(this: { healthCheck: typeof whatsappHealthCheck }) {
    this.healthCheck = whatsappHealthCheck;
  }),
}));
vi.mock("../infrastructure/whatsapp-env", () => ({ isWhatsAppConfigured: isWhatsAppConfiguredMock }));

import { getProviderHealthSummary } from "./get-provider-health-summary.service";

const context = { tenantId: "tenant-1", actingUserId: "user-1" };

describe("getProviderHealthSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("always reports IN_APP as configured and healthy", async () => {
    isSmtpConfiguredMock.mockReturnValue(false);
    isSmsGatewayConfiguredMock.mockReturnValue(false);
    isWhatsAppConfiguredMock.mockReturnValue(false);

    const summary = await getProviderHealthSummary(context);
    const inApp = summary.find((item) => item.channel === "IN_APP");
    expect(inApp).toEqual({ channel: "IN_APP", providerName: "in-app", configured: true, healthy: true });
  });

  it("reports every channel, including PUSH as unconfigured/not-attempted", async () => {
    isSmtpConfiguredMock.mockReturnValue(false);
    isSmsGatewayConfiguredMock.mockReturnValue(false);
    isWhatsAppConfiguredMock.mockReturnValue(false);

    const summary = await getProviderHealthSummary(context);
    expect(summary.map((item) => item.channel).sort()).toEqual(["EMAIL", "IN_APP", "PUSH", "SMS", "WHATSAPP"]);
    const push = summary.find((item) => item.channel === "PUSH");
    expect(push).toEqual({ channel: "PUSH", providerName: "unregistered", configured: false, healthy: null });
  });

  it("reports unconfigured/not-attempted for a channel with no real provider configured, without calling healthCheck", async () => {
    isSmtpConfiguredMock.mockReturnValue(false);
    isSmsGatewayConfiguredMock.mockReturnValue(true);
    isWhatsAppConfiguredMock.mockReturnValue(false);
    smsHealthCheck.mockResolvedValue({ healthy: true });

    const summary = await getProviderHealthSummary(context);
    const email = summary.find((item) => item.channel === "EMAIL");
    expect(email).toEqual({ channel: "EMAIL", providerName: "unconfigured", configured: false, healthy: null });
    expect(smtpHealthCheck).not.toHaveBeenCalled();
  });

  it("calls healthCheck and reports the real result for each configured channel", async () => {
    isSmtpConfiguredMock.mockReturnValue(true);
    isSmsGatewayConfiguredMock.mockReturnValue(true);
    isWhatsAppConfiguredMock.mockReturnValue(true);
    smtpHealthCheck.mockResolvedValue({ healthy: true });
    smsHealthCheck.mockResolvedValue({ healthy: false, details: "Could not reach provider service." });
    whatsappHealthCheck.mockResolvedValue({ healthy: true });

    const summary = await getProviderHealthSummary(context);

    expect(summary.find((item) => item.channel === "EMAIL")).toEqual({
      channel: "EMAIL",
      providerName: "smtp",
      configured: true,
      healthy: true,
      details: undefined,
    });
    expect(summary.find((item) => item.channel === "SMS")).toEqual({
      channel: "SMS",
      providerName: "http-gateway",
      configured: true,
      healthy: false,
      details: "Could not reach provider service.",
    });
    expect(summary.find((item) => item.channel === "WHATSAPP")).toMatchObject({
      providerName: "whatsapp-cloud-api",
      configured: true,
      healthy: true,
    });
  });
});
