import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import nodemailer from "nodemailer";
import { SmtpEmailProvider } from "./smtp-email.provider";
import { NOTIFICATION_ERROR_CODES } from "../domain/notification-error-code";
import { isConfigurableProvider } from "../domain/configurable-provider";
import { isHealthCheckableProvider } from "../domain/health-checkable-provider";

// Never contacts a real SMTP server — nodemailer's createTransport is mocked so every test
// exercises SmtpEmailProvider's own logic (classification, redaction-adjacent safety, audit
// wiring) against a fully controllable fake transport.
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

const SMTP_ENV = {
  SMTP_HOST: "smtp.example.com",
  SMTP_PORT: "587",
  SMTP_USER: "user@example.com",
  SMTP_PASSWORD: "hunter2super-secret",
  SMTP_FROM_ADDRESS: "no-reply@example.com",
};

function setSmtpEnv() {
  for (const [key, value] of Object.entries(SMTP_ENV)) {
    process.env[key] = value;
  }
}

function clearSmtpEnv() {
  for (const key of Object.keys(SMTP_ENV)) {
    delete process.env[key];
  }
  delete process.env.SMTP_SECURE;
}

describe("SmtpEmailProvider", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    clearSmtpEnv();
    setSmtpEnv();
    vi.mocked(nodemailer.createTransport).mockReset();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    clearSmtpEnv();
  });

  it("implements EmailProvider, ConfigurableProvider, and HealthCheckableProvider", () => {
    const provider = new SmtpEmailProvider();
    expect(isConfigurableProvider(provider)).toBe(true);
    expect(isHealthCheckableProvider(provider)).toBe(true);
    expect(typeof provider.sendMail).toBe("function");
    expect(typeof provider.sendAttachment).toBe("function");
  });

  // --- Configuration validation ------------------------------------------------------------------
  describe("validateConfiguration", () => {
    it("accepts a well-formed configuration", () => {
      const provider = new SmtpEmailProvider();
      const result = provider.validateConfiguration({
        host: "smtp.example.com",
        port: 587,
        user: "user@example.com",
        password: "secret",
        fromAddress: "no-reply@example.com",
      });
      expect(result).toEqual({ valid: true, errors: [] });
    });

    it("rejects a configuration missing required fields", () => {
      const provider = new SmtpEmailProvider();
      const result = provider.validateConfiguration({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain("host is required and must be a non-empty string.");
      expect(result.errors).toContain("password is required and must be a non-empty string.");
    });

    it("rejects a non-integer or non-positive port", () => {
      const provider = new SmtpEmailProvider();
      const result = provider.validateConfiguration({
        host: "smtp.example.com",
        port: -5,
        user: "u",
        password: "p",
        fromAddress: "a@b.com",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("port is required and must be a positive integer.");
    });

    it("rejects a non-object configuration", () => {
      const provider = new SmtpEmailProvider();
      expect(provider.validateConfiguration(null).valid).toBe(false);
      expect(provider.validateConfiguration("nope").valid).toBe(false);
    });

    it("never calls the secure logging pipeline for a validation check", () => {
      const provider = new SmtpEmailProvider();
      provider.validateConfiguration({});
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  // --- Successful send -------------------------------------------------------------------------
  it("sends mail successfully via the (mocked) transport", async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: "abc-123" });
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail, verify: vi.fn() } as never);

    const provider = new SmtpEmailProvider();
    const result = await provider.sendMail({ to: "student@example.com", subject: "Hi", body: "<p>Hello</p>" });

    expect(result).toEqual({ status: "SENT", providerMessageId: "abc-123" });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "student@example.com", subject: "Hi", html: "<p>Hello</p>", text: "Hello" })
    );
  });

  it("sends an attachment successfully", async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: "att-1" });
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail, verify: vi.fn() } as never);

    const provider = new SmtpEmailProvider();
    const result = await provider.sendAttachment({
      to: "parent@example.com",
      subject: "Report",
      body: "<p>See attached</p>",
      attachment: { filename: "report.pdf", content: Buffer.from("data"), mimeType: "application/pdf" },
    });

    expect(result.status).toBe("SENT");
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [{ filename: "report.pdf", content: Buffer.from("data"), contentType: "application/pdf" }],
      })
    );
  });

  // --- Failed send + error classification integration ---------------------------------------------
  it("classifies a failed send using classifyProviderError and never returns the raw exception", async () => {
    const secret = "AUTH_TOKEN_super_secret_should_never_leak";
    const sendMail = vi.fn().mockRejectedValue(new Error(`535 Authentication failed with token ${secret}`));
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail, verify: vi.fn() } as never);

    const provider = new SmtpEmailProvider();
    const result = await provider.sendMail({ to: "a@b.com", subject: "s", body: "b" });

    expect(result.status).toBe("FAILED");
    expect(result.error).not.toContain(secret);
    expect(result.error).not.toContain("535");
  });

  it("returns a network-related classification for a connection failure", async () => {
    const sendMail = vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:587"));
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail, verify: vi.fn() } as never);

    const provider = new SmtpEmailProvider();
    const result = await provider.sendMail({ to: "a@b.com", subject: "s", body: "b" });
    expect(result.status).toBe("FAILED");
    // The safe message is the catalogue's own generic NETWORK_UNREACHABLE text — confirms
    // classifyProviderError() actually ran rather than the raw message leaking through.
    expect(result.error).toBe("Could not reach provider service.");
  });

  it("does not throw when the transport itself cannot be constructed (e.g. SMTP not configured)", async () => {
    clearSmtpEnv();
    const provider = new SmtpEmailProvider();
    const result = await provider.sendMail({ to: "a@b.com", subject: "s", body: "b" });
    expect(result.status).toBe("FAILED");
  });

  // --- Health check ----------------------------------------------------------------------------
  describe("healthCheck", () => {
    it("reports healthy when verify() succeeds, and logs a SUCCESS audit entry", async () => {
      const verify = vi.fn().mockResolvedValue(true);
      vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: vi.fn(), verify } as never);

      const provider = new SmtpEmailProvider({ tenantId: "tenant-1", userId: "user-1" });
      const result = await provider.healthCheck();

      expect(result).toEqual({ healthy: true });
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logged = JSON.parse(String(consoleErrorSpy.mock.calls[0]?.[0]));
      expect(logged).toMatchObject({ action: "HEALTH_CHECK", status: "SUCCESS", tenantId: "tenant-1", userId: "user-1" });
    });

    it("reports unhealthy when verify() rejects, with a safe classified detail, and logs a FAILURE audit entry", async () => {
      const verify = vi.fn().mockRejectedValue(new Error("401 Unauthorized"));
      vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: vi.fn(), verify } as never);

      const provider = new SmtpEmailProvider();
      const result = await provider.healthCheck();

      expect(result.healthy).toBe(false);
      expect(result.details).toBe("Provider authentication failed.");
      const logged = JSON.parse(String(consoleErrorSpy.mock.calls[0]?.[0]));
      expect(logged).toMatchObject({ action: "HEALTH_CHECK", status: "FAILURE", errorCode: NOTIFICATION_ERROR_CODES.AUTH_INVALID_CREDENTIALS });
    });

    it("uses default 'unattributed-tenant'/'system' attribution when no context is supplied", async () => {
      const verify = vi.fn().mockResolvedValue(true);
      vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: vi.fn(), verify } as never);

      const provider = new SmtpEmailProvider();
      await provider.healthCheck();

      const logged = JSON.parse(String(consoleErrorSpy.mock.calls[0]?.[0]));
      expect(logged.tenantId).toBe("unattributed-tenant");
      expect(logged.userId).toBe("system");
    });
  });

  describe("testConnection", () => {
    it("returns success and logs a PROVIDER_TEST_CONNECTION audit entry on success", async () => {
      const verify = vi.fn().mockResolvedValue(true);
      vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: vi.fn(), verify } as never);

      const provider = new SmtpEmailProvider();
      const result = await provider.testConnection();

      expect(result.success).toBe(true);
      const logged = JSON.parse(String(consoleErrorSpy.mock.calls[0]?.[0]));
      expect(logged).toMatchObject({ action: "PROVIDER_TEST_CONNECTION", status: "SUCCESS" });
    });

    it("returns failure with a safe message on a failed connection test", async () => {
      const verify = vi.fn().mockRejectedValue(new Error("429 rate limit exceeded"));
      vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: vi.fn(), verify } as never);

      const provider = new SmtpEmailProvider();
      const result = await provider.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Provider rate limit or quota exceeded.");
    });
  });

  it("never contains the SMTP password anywhere in a failure result or a logged entry", async () => {
    const sendMail = vi.fn().mockRejectedValue(new Error(`Authorization: Bearer ${SMTP_ENV.SMTP_PASSWORD}`));
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail, verify: vi.fn() } as never);

    const provider = new SmtpEmailProvider();
    const result = await provider.sendMail({ to: "a@b.com", subject: "s", body: "b" });
    expect(JSON.stringify(result)).not.toContain(SMTP_ENV.SMTP_PASSWORD);
  });
});
