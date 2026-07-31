import { getSmsGatewayConfig, isSmsGatewayConfigured, type SmsGatewayConfig } from "./sms-env";
import { classifyProviderError } from "../application/classify-provider-error.helpers";
import { logCommunicationAudit } from "../application/log-communication-audit.helpers";
import { COMMUNICATION_AUDIT_ACTIONS } from "../domain/communication-audit-action";
import type { SMSProvider, SMSProviderResult } from "../domain/sms-provider";
import type { ConfigurableProvider, ConfigurationValidationResult, TestConnectionResult } from "../domain/configurable-provider";
import type { HealthCheckableProvider, HealthCheckResult } from "../domain/health-checkable-provider";

// Phase 15B Milestone M10 — the one production SMS provider implementation, deliberately
// vendor-neutral: it speaks a generic "POST JSON to a configured URL with a Bearer API key"
// shape rather than hardcoding any single gateway's SDK or request format (MSG91/Twilio/
// Textlocal/Fast2SMS all expose an HTTP API this shape can reach). No gateway-specific business
// logic lives in this class — the ONE piece of vendor-specific knowledge (exact request field
// names) is isolated behind an injectable `SmsGatewayRequestBuilder`, defaulting to
// `defaultSmsGatewayRequestBuilder` below. A future MSG91/Twilio/etc. integration is either (a) a
// new request builder passed to this same class, reusing 100% of the transport/error-handling/
// audit-logging plumbing, or (b) a new class entirely if a vendor's SDK is preferred over raw
// HTTP — either way, nothing here needs to change.
//
// Uses the platform's native `fetch` (no new HTTP client dependency) — Next.js 16 / Node 18+
// ships it globally.
//
// Deliberately has NO "server-only" marker — same reasoning as smtp-email.provider.ts (Milestone
// M8): the package throws unconditionally under this project's vitest setup, which would block
// direct unit testing; the only production import site (notification-sender-factory.ts) retains
// its own "server-only" marker, so client-bundle protection is unaffected.
export interface SmsGatewayContext {
  tenantId?: string;
  userId?: string;
}

export interface SmsGatewayRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

export type SmsGatewayRequestBuilder = (
  config: SmsGatewayConfig,
  input: { to: string; message: string }
) => SmsGatewayRequest;

// The generic, vendor-neutral default — a plain JSON POST with a Bearer token. This is the
// extension point: swap this function (via the constructor) for a vendor-specific one without
// touching sendSMS/healthCheck/testConnection/validateConfiguration below.
export function defaultSmsGatewayRequestBuilder(
  config: SmsGatewayConfig,
  input: { to: string; message: string }
): SmsGatewayRequest {
  return {
    url: config.apiUrl,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      to: input.to,
      message: input.message,
      ...(config.senderId ? { senderId: config.senderId } : {}),
    }),
  };
}

const CHANNEL = "SMS" as const;
const PROVIDER_NAME = "http-gateway";
const REACHABILITY_TIMEOUT_MS = 5000;

export class HttpSmsProvider implements SMSProvider, ConfigurableProvider, HealthCheckableProvider {
  private readonly tenantId: string;
  private readonly userId: string;
  private readonly requestBuilder: SmsGatewayRequestBuilder;

  constructor(context: SmsGatewayContext = {}, requestBuilder: SmsGatewayRequestBuilder = defaultSmsGatewayRequestBuilder) {
    this.tenantId = context.tenantId ?? "unattributed-tenant";
    this.userId = context.userId ?? "system";
    this.requestBuilder = requestBuilder;
  }

  async sendSMS(input: { to: string; message: string }): Promise<SMSProviderResult> {
    try {
      const config = getSmsGatewayConfig();
      const request = this.requestBuilder(config, input);
      const response = await fetch(request.url, { method: "POST", headers: request.headers, body: request.body });
      if (!response.ok) {
        throw new Error(`SMS gateway responded with status ${response.status}.`);
      }
      const data = (await response.json().catch(() => ({}))) as { id?: string; messageId?: string };
      return { status: "SENT", providerMessageId: data.id ?? data.messageId };
    } catch (rawError) {
      const classified = classifyProviderError(rawError, CHANNEL);
      return { status: "FAILED", error: classified.safeMessage };
    }
  }

  // No vendor-specific "account status" endpoint is assumed (per "no hardcoded gateway-specific
  // business logic") — reachability of the configured URL is used as a generic, vendor-agnostic
  // proxy for "is this gateway configured and network-reachable." A real vendor integration may
  // override this with a proper account-status API call once one is chosen.
  private async checkReachability(): Promise<void> {
    const config = getSmsGatewayConfig();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REACHABILITY_TIMEOUT_MS);
    try {
      await fetch(config.apiUrl, { method: "HEAD", signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      await this.checkReachability();
      logCommunicationAudit({
        tenantId: this.tenantId,
        userId: this.userId,
        action: COMMUNICATION_AUDIT_ACTIONS.HEALTH_CHECK,
        provider: PROVIDER_NAME,
        channel: CHANNEL,
        status: "SUCCESS",
      });
      return { healthy: true };
    } catch (rawError) {
      const classified = classifyProviderError(rawError, CHANNEL);
      logCommunicationAudit({
        tenantId: this.tenantId,
        userId: this.userId,
        action: COMMUNICATION_AUDIT_ACTIONS.HEALTH_CHECK,
        provider: PROVIDER_NAME,
        channel: CHANNEL,
        status: "FAILURE",
        error: rawError,
      });
      return { healthy: false, details: classified.safeMessage };
    }
  }

  async testConnection(): Promise<TestConnectionResult> {
    try {
      await this.checkReachability();
      logCommunicationAudit({
        tenantId: this.tenantId,
        userId: this.userId,
        action: COMMUNICATION_AUDIT_ACTIONS.PROVIDER_TEST_CONNECTION,
        provider: PROVIDER_NAME,
        channel: CHANNEL,
        status: "SUCCESS",
      });
      return { success: true, message: "SMS gateway is reachable." };
    } catch (rawError) {
      const classified = classifyProviderError(rawError, CHANNEL);
      logCommunicationAudit({
        tenantId: this.tenantId,
        userId: this.userId,
        action: COMMUNICATION_AUDIT_ACTIONS.PROVIDER_TEST_CONNECTION,
        provider: PROVIDER_NAME,
        channel: CHANNEL,
        status: "FAILURE",
        error: rawError,
      });
      return { success: false, message: classified.safeMessage };
    }
  }

  validateConfiguration(config: unknown): ConfigurationValidationResult {
    if (typeof config !== "object" || config === null) {
      return { valid: false, errors: ["Configuration must be an object."] };
    }
    const candidate = config as Record<string, unknown>;
    const errors: string[] = [];

    if (!candidate.apiUrl || typeof candidate.apiUrl !== "string" || candidate.apiUrl.trim() === "") {
      errors.push("apiUrl is required and must be a non-empty string.");
    } else {
      try {
        new URL(candidate.apiUrl);
      } catch {
        errors.push("apiUrl must be a valid URL.");
      }
    }
    if (!candidate.apiKey || typeof candidate.apiKey !== "string" || candidate.apiKey.trim() === "") {
      errors.push("apiKey is required and must be a non-empty string.");
    }
    if (candidate.senderId !== undefined && typeof candidate.senderId !== "string") {
      errors.push("senderId, if provided, must be a string.");
    }

    return { valid: errors.length === 0, errors };
  }
}

export { isSmsGatewayConfigured };
