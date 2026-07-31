// Phase 15B Milestone M7 — Mock Provider Infrastructure for SMS. See mock-email.provider.ts's own
// comment for the Mock-vs-Unconfigured distinction. Never contacts an external service.
import type { SMSProvider, SMSProviderResult } from "../../domain/sms-provider";
import type { ConfigurableProvider, ConfigurationValidationResult, TestConnectionResult } from "../../domain/configurable-provider";
import type { HealthCheckableProvider, HealthCheckResult } from "../../domain/health-checkable-provider";

export interface MockSmsProviderOptions {
  behavior?: "SUCCESS" | "FAILURE";
  failureMessage?: string;
  healthy?: boolean;
}

export interface MockSentSms {
  to: string;
  message: string;
}

export class MockSmsProvider implements SMSProvider, ConfigurableProvider, HealthCheckableProvider {
  private behavior: "SUCCESS" | "FAILURE";
  private failureMessage: string;
  private healthy: boolean;

  readonly sentSms: MockSentSms[] = [];

  constructor(options: MockSmsProviderOptions = {}) {
    this.behavior = options.behavior ?? "SUCCESS";
    this.failureMessage = options.failureMessage ?? "Mock SMS provider simulated failure.";
    this.healthy = options.healthy ?? true;
  }

  setBehavior(behavior: "SUCCESS" | "FAILURE"): void {
    this.behavior = behavior;
  }

  setHealthy(healthy: boolean): void {
    this.healthy = healthy;
  }

  async sendSMS(input: { to: string; message: string }): Promise<SMSProviderResult> {
    this.sentSms.push({ to: input.to, message: input.message });
    if (this.behavior === "FAILURE") {
      return { status: "FAILED", error: this.failureMessage };
    }
    return { status: "SENT", providerMessageId: `mock-sms-${this.sentSms.length}` };
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
    if (!candidate.accountSid || typeof candidate.accountSid !== "string" || candidate.accountSid.trim() === "") {
      errors.push("accountSid is required and must be a non-empty string.");
    }
    if (!candidate.authToken || typeof candidate.authToken !== "string" || candidate.authToken.trim() === "") {
      errors.push("authToken is required and must be a non-empty string.");
    }
    return { valid: errors.length === 0, errors };
  }

  async testConnection(): Promise<TestConnectionResult> {
    return this.healthy
      ? { success: true, message: "Mock connection test succeeded." }
      : { success: false, message: "Mock connection test failed." };
  }
}
