import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getSmtpConfig, isSmtpConfigured } from "./smtp-env";

const SMTP_ENV_KEYS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM_ADDRESS", "SMTP_SECURE"];

describe("smtp-env", () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = {};
    for (const key of SMTP_ENV_KEYS) {
      originalEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of SMTP_ENV_KEYS) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  describe("isSmtpConfigured", () => {
    it("returns false when no SMTP variables are set", () => {
      expect(isSmtpConfigured()).toBe(false);
    });

    it("returns false when only some required variables are set", () => {
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_PORT = "587";
      expect(isSmtpConfigured()).toBe(false);
    });

    it("returns true when every required variable is set", () => {
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user@example.com";
      process.env.SMTP_PASSWORD = "secret";
      process.env.SMTP_FROM_ADDRESS = "no-reply@example.com";
      expect(isSmtpConfigured()).toBe(true);
    });
  });

  describe("getSmtpConfig", () => {
    it("throws a descriptive error when required variables are missing", () => {
      expect(() => getSmtpConfig()).toThrow(/Missing required environment variable: SMTP_HOST/);
    });

    it("returns a fully-populated config when everything is set", () => {
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user@example.com";
      process.env.SMTP_PASSWORD = "secret";
      process.env.SMTP_FROM_ADDRESS = "no-reply@example.com";

      const config = getSmtpConfig();
      expect(config).toEqual({
        host: "smtp.example.com",
        port: 587,
        secure: false,
        user: "user@example.com",
        password: "secret",
        fromAddress: "no-reply@example.com",
      });
    });

    it("defaults secure to true for port 465 (implicit TLS)", () => {
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "user@example.com";
      process.env.SMTP_PASSWORD = "secret";
      process.env.SMTP_FROM_ADDRESS = "no-reply@example.com";

      expect(getSmtpConfig().secure).toBe(true);
    });

    it("respects an explicit SMTP_SECURE override", () => {
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "user@example.com";
      process.env.SMTP_PASSWORD = "secret";
      process.env.SMTP_FROM_ADDRESS = "no-reply@example.com";
      process.env.SMTP_SECURE = "false";

      expect(getSmtpConfig().secure).toBe(false);
    });

    it("throws on a non-numeric SMTP_PORT", () => {
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_PORT = "not-a-number";
      process.env.SMTP_USER = "user@example.com";
      process.env.SMTP_PASSWORD = "secret";
      process.env.SMTP_FROM_ADDRESS = "no-reply@example.com";

      expect(() => getSmtpConfig()).toThrow(/Invalid SMTP_PORT/);
    });
  });
});
