// Phase 15B Milestone M7 — Mock Provider Infrastructure for WhatsApp. See mock-email.provider.ts's
// own comment for the Mock-vs-Unconfigured distinction. Never contacts an external service.
import type { WhatsAppProvider, WhatsAppProviderResult } from "../../domain/whatsapp-provider";
import type { ConfigurableProvider, ConfigurationValidationResult, TestConnectionResult } from "../../domain/configurable-provider";
import type { HealthCheckableProvider, HealthCheckResult } from "../../domain/health-checkable-provider";

export interface MockWhatsAppProviderOptions {
  behavior?: "SUCCESS" | "FAILURE";
  failureMessage?: string;
  healthy?: boolean;
}

export interface MockSentWhatsApp {
  to: string;
  kind: "message" | "template" | "media";
  content: string;
}

export class MockWhatsAppProvider implements WhatsAppProvider, ConfigurableProvider, HealthCheckableProvider {
  private behavior: "SUCCESS" | "FAILURE";
  private failureMessage: string;
  private healthy: boolean;

  readonly sent: MockSentWhatsApp[] = [];

  constructor(options: MockWhatsAppProviderOptions = {}) {
    this.behavior = options.behavior ?? "SUCCESS";
    this.failureMessage = options.failureMessage ?? "Mock WhatsApp provider simulated failure.";
    this.healthy = options.healthy ?? true;
  }

  setBehavior(behavior: "SUCCESS" | "FAILURE"): void {
    this.behavior = behavior;
  }

  setHealthy(healthy: boolean): void {
    this.healthy = healthy;
  }

  private result(): WhatsAppProviderResult {
    if (this.behavior === "FAILURE") {
      return { status: "FAILED", error: this.failureMessage };
    }
    return { status: "SENT", providerMessageId: `mock-whatsapp-${this.sent.length}` };
  }

  async sendMessage(input: { to: string; message: string }): Promise<WhatsAppProviderResult> {
    this.sent.push({ to: input.to, kind: "message", content: input.message });
    return this.result();
  }

  async sendTemplate(input: { to: string; templateName: string; variables: Record<string, string> }): Promise<WhatsAppProviderResult> {
    this.sent.push({ to: input.to, kind: "template", content: input.templateName });
    return this.result();
  }

  async sendMedia(input: { to: string; mediaUrl: string; caption?: string }): Promise<WhatsAppProviderResult> {
    this.sent.push({ to: input.to, kind: "media", content: input.mediaUrl });
    return this.result();
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
    if (!candidate.phoneNumberId || typeof candidate.phoneNumberId !== "string" || candidate.phoneNumberId.trim() === "") {
      errors.push("phoneNumberId is required and must be a non-empty string.");
    }
    if (!candidate.accessToken || typeof candidate.accessToken !== "string" || candidate.accessToken.trim() === "") {
      errors.push("accessToken is required and must be a non-empty string.");
    }
    return { valid: errors.length === 0, errors };
  }

  async testConnection(): Promise<TestConnectionResult> {
    return this.healthy
      ? { success: true, message: "Mock connection test succeeded." }
      : { success: false, message: "Mock connection test failed." };
  }
}
