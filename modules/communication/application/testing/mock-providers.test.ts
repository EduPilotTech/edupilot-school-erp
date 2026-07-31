import { describe, expect, it } from "vitest";
import { MockEmailProvider } from "./mock-email.provider";
import { MockSmsProvider } from "./mock-sms.provider";
import { MockWhatsAppProvider } from "./mock-whatsapp.provider";
import { isConfigurableProvider } from "../../domain/configurable-provider";
import { isHealthCheckableProvider } from "../../domain/health-checkable-provider";

describe("MockEmailProvider", () => {
  it("implements ConfigurableProvider and HealthCheckableProvider", () => {
    const provider = new MockEmailProvider();
    expect(isConfigurableProvider(provider)).toBe(true);
    expect(isHealthCheckableProvider(provider)).toBe(true);
  });

  it("simulates a successful send by default", async () => {
    const provider = new MockEmailProvider();
    const result = await provider.sendMail({ to: "a@example.com", subject: "Hi", body: "Hello" });
    expect(result.status).toBe("SENT");
    expect(result.providerMessageId).toBeDefined();
    expect(provider.sentMail).toHaveLength(1);
    expect(provider.sentMail[0]).toMatchObject({ to: "a@example.com", subject: "Hi", body: "Hello" });
  });

  it("simulates a configured failure", async () => {
    const provider = new MockEmailProvider({ behavior: "FAILURE", failureMessage: "simulated SMTP rejection" });
    const result = await provider.sendMail({ to: "a@example.com", subject: "Hi", body: "Hello" });
    expect(result.status).toBe("FAILED");
    expect(result.error).toBe("simulated SMTP rejection");
  });

  it("allows switching behavior at runtime via setBehavior", async () => {
    const provider = new MockEmailProvider();
    expect((await provider.sendMail({ to: "a@example.com", subject: "s", body: "b" })).status).toBe("SENT");
    provider.setBehavior("FAILURE");
    expect((await provider.sendMail({ to: "a@example.com", subject: "s", body: "b" })).status).toBe("FAILED");
  });

  it("records attachment sends distinctly from plain mail", async () => {
    const provider = new MockEmailProvider();
    await provider.sendAttachment({
      to: "a@example.com",
      subject: "s",
      body: "b",
      attachment: { filename: "report.pdf", content: Buffer.from("x"), mimeType: "application/pdf" },
    });
    expect(provider.sentMail[0].attachment).toMatchObject({ filename: "report.pdf", mimeType: "application/pdf" });
  });

  it("reports healthy by default and unhealthy when configured", async () => {
    const healthy = new MockEmailProvider();
    expect(await healthy.healthCheck()).toEqual({ healthy: true });

    const unhealthy = new MockEmailProvider({ healthy: false });
    const result = await unhealthy.healthCheck();
    expect(result.healthy).toBe(false);
    expect(result.details).toBeDefined();
  });

  it("setHealthy toggles both healthCheck and testConnection results", async () => {
    const provider = new MockEmailProvider();
    provider.setHealthy(false);
    expect((await provider.healthCheck()).healthy).toBe(false);
    expect((await provider.testConnection()).success).toBe(false);
  });

  it("validates configuration: rejects a missing apiKey", () => {
    const provider = new MockEmailProvider();
    const result = provider.validateConfiguration({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("apiKey is required and must be a non-empty string.");
  });

  it("validates configuration: accepts a well-formed config", () => {
    const provider = new MockEmailProvider();
    const result = provider.validateConfiguration({ apiKey: "sk_test_123", fromAddress: "no-reply@example.com" });
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("validates configuration: rejects a non-object config", () => {
    const provider = new MockEmailProvider();
    expect(provider.validateConfiguration(null).valid).toBe(false);
    expect(provider.validateConfiguration("a string").valid).toBe(false);
  });

  it("never performs any network call — sendMail resolves purely in-memory", async () => {
    const provider = new MockEmailProvider();
    const start = Date.now();
    await provider.sendMail({ to: "a@example.com", subject: "s", body: "b" });
    expect(Date.now() - start).toBeLessThan(50);
  });
});

describe("MockSmsProvider", () => {
  it("implements ConfigurableProvider and HealthCheckableProvider", () => {
    const provider = new MockSmsProvider();
    expect(isConfigurableProvider(provider)).toBe(true);
    expect(isHealthCheckableProvider(provider)).toBe(true);
  });

  it("simulates a successful send by default", async () => {
    const provider = new MockSmsProvider();
    const result = await provider.sendSMS({ to: "+15551234567", message: "hello" });
    expect(result.status).toBe("SENT");
    expect(provider.sentSms).toHaveLength(1);
  });

  it("simulates a configured failure", async () => {
    const provider = new MockSmsProvider({ behavior: "FAILURE" });
    const result = await provider.sendSMS({ to: "+15551234567", message: "hello" });
    expect(result.status).toBe("FAILED");
  });

  it("reports health check results", async () => {
    const provider = new MockSmsProvider({ healthy: false });
    expect((await provider.healthCheck()).healthy).toBe(false);
  });

  it("validates configuration: requires accountSid and authToken", () => {
    const provider = new MockSmsProvider();
    const result = provider.validateConfiguration({ accountSid: "AC123" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("authToken is required and must be a non-empty string.");
  });

  it("validates configuration: accepts a well-formed config", () => {
    const provider = new MockSmsProvider();
    expect(provider.validateConfiguration({ accountSid: "AC123", authToken: "tok123" })).toEqual({
      valid: true,
      errors: [],
    });
  });
});

describe("MockWhatsAppProvider", () => {
  it("implements ConfigurableProvider and HealthCheckableProvider", () => {
    const provider = new MockWhatsAppProvider();
    expect(isConfigurableProvider(provider)).toBe(true);
    expect(isHealthCheckableProvider(provider)).toBe(true);
  });

  it("simulates successful sendMessage, sendTemplate, and sendMedia", async () => {
    const provider = new MockWhatsAppProvider();
    expect((await provider.sendMessage({ to: "+15551234567", message: "hi" })).status).toBe("SENT");
    expect(
      (await provider.sendTemplate({ to: "+15551234567", templateName: "welcome", variables: {} })).status
    ).toBe("SENT");
    expect((await provider.sendMedia({ to: "+15551234567", mediaUrl: "https://example.com/x.png" })).status).toBe(
      "SENT"
    );
    expect(provider.sent).toHaveLength(3);
    expect(provider.sent.map((entry) => entry.kind)).toEqual(["message", "template", "media"]);
  });

  it("simulates a configured failure across all three send methods", async () => {
    const provider = new MockWhatsAppProvider({ behavior: "FAILURE" });
    expect((await provider.sendMessage({ to: "+1", message: "x" })).status).toBe("FAILED");
    expect((await provider.sendTemplate({ to: "+1", templateName: "t", variables: {} })).status).toBe("FAILED");
    expect((await provider.sendMedia({ to: "+1", mediaUrl: "https://x" })).status).toBe("FAILED");
  });

  it("reports health check results", async () => {
    const provider = new MockWhatsAppProvider({ healthy: false });
    expect((await provider.healthCheck()).healthy).toBe(false);
  });

  it("validates configuration: requires phoneNumberId and accessToken", () => {
    const provider = new MockWhatsAppProvider();
    const result = provider.validateConfiguration({ phoneNumberId: "123456" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("accessToken is required and must be a non-empty string.");
  });

  it("validates configuration: accepts a well-formed config", () => {
    const provider = new MockWhatsAppProvider();
    expect(provider.validateConfiguration({ phoneNumberId: "123456", accessToken: "tok" })).toEqual({
      valid: true,
      errors: [],
    });
  });
});
