// Phase 15B Milestone M7 — Mock Provider Infrastructure. A test double for `EmailProvider`,
// distinct in purpose from `UnconfiguredEmailProvider` (infrastructure/unconfigured-email
// .provider.ts): the Unconfigured stub is PRODUCTION code, honestly always reporting "not
// configured" for real, unconfigured deployments; this Mock is TEST-ONLY, configurable to
// simulate either a successful send or a specific failure on demand, so tests can exercise both
// code paths through the Sender/Registry/Queue layers. Never contacts an external service — every
// method is a synchronous in-memory decision plus a resolved Promise.
import type { EmailProvider, EmailProviderResult } from "../../domain/email-provider";
import type { ConfigurableProvider, ConfigurationValidationResult, TestConnectionResult } from "../../domain/configurable-provider";
import type { HealthCheckableProvider, HealthCheckResult } from "../../domain/health-checkable-provider";

export interface MockEmailProviderOptions {
  behavior?: "SUCCESS" | "FAILURE";
  failureMessage?: string;
  healthy?: boolean;
}

export interface MockSentMail {
  to: string;
  subject: string;
  body: string;
  attachment?: { filename: string; mimeType: string };
}

export class MockEmailProvider implements EmailProvider, ConfigurableProvider, HealthCheckableProvider {
  private behavior: "SUCCESS" | "FAILURE";
  private failureMessage: string;
  private healthy: boolean;

  // Records every call this session so a test can assert on exactly what was sent, without the
  // mock needing any external observation mechanism.
  readonly sentMail: MockSentMail[] = [];

  constructor(options: MockEmailProviderOptions = {}) {
    this.behavior = options.behavior ?? "SUCCESS";
    this.failureMessage = options.failureMessage ?? "Mock email provider simulated failure.";
    this.healthy = options.healthy ?? true;
  }

  setBehavior(behavior: "SUCCESS" | "FAILURE"): void {
    this.behavior = behavior;
  }

  setHealthy(healthy: boolean): void {
    this.healthy = healthy;
  }

  async sendMail(input: { to: string; subject: string; body: string }): Promise<EmailProviderResult> {
    this.sentMail.push({ to: input.to, subject: input.subject, body: input.body });
    if (this.behavior === "FAILURE") {
      return { status: "FAILED", error: this.failureMessage };
    }
    return { status: "SENT", providerMessageId: `mock-email-${this.sentMail.length}` };
  }

  async sendAttachment(input: {
    to: string;
    subject: string;
    body: string;
    attachment: { filename: string; content: Buffer; mimeType: string };
  }): Promise<EmailProviderResult> {
    this.sentMail.push({
      to: input.to,
      subject: input.subject,
      body: input.body,
      attachment: { filename: input.attachment.filename, mimeType: input.attachment.mimeType },
    });
    if (this.behavior === "FAILURE") {
      return { status: "FAILED", error: this.failureMessage };
    }
    return { status: "SENT", providerMessageId: `mock-email-${this.sentMail.length}` };
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return this.healthy ? { healthy: true } : { healthy: false, details: "Mock provider marked unhealthy for testing." };
  }

  validateConfiguration(config: unknown): ConfigurationValidationResult {
    const errors: string[] = [];
    if (typeof config !== "object" || config === null) {
      return { valid: false, errors: ["Configuration must be an object."] };
    }
    const candidate = config as Record<string, unknown>;
    if (!candidate.apiKey || typeof candidate.apiKey !== "string" || candidate.apiKey.trim() === "") {
      errors.push("apiKey is required and must be a non-empty string.");
    }
    if (candidate.fromAddress !== undefined && typeof candidate.fromAddress !== "string") {
      errors.push("fromAddress, if provided, must be a string.");
    }
    return { valid: errors.length === 0, errors };
  }

  async testConnection(): Promise<TestConnectionResult> {
    return this.healthy
      ? { success: true, message: "Mock connection test succeeded." }
      : { success: false, message: "Mock connection test failed." };
  }
}
