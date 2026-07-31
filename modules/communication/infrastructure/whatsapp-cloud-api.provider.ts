import { getWhatsAppConfig, isWhatsAppConfigured, type WhatsAppCloudApiConfig } from "./whatsapp-env";
import { classifyProviderError } from "../application/classify-provider-error.helpers";
import { logCommunicationAudit } from "../application/log-communication-audit.helpers";
import { COMMUNICATION_AUDIT_ACTIONS } from "../domain/communication-audit-action";
import type { WhatsAppProvider, WhatsAppProviderResult } from "../domain/whatsapp-provider";
import type { ConfigurableProvider, ConfigurationValidationResult, TestConnectionResult } from "../domain/configurable-provider";
import type { HealthCheckableProvider, HealthCheckResult } from "../domain/health-checkable-provider";

// Phase 15B Milestone M11 — the real Meta WhatsApp Cloud API implementation (named explicitly in
// scope, unlike M10's deliberately vendor-neutral SMS gateway). Speaks Meta's actual Graph API
// message-send shape (`messaging_product: "whatsapp"`, POST to `/{apiVersion}/{phoneNumberId}
// /messages`) using the platform's native `fetch` — no new HTTP client dependency.
//
// Deliberately has NO "server-only" marker — same reasoning as smtp-email.provider.ts (M8) and
// http-sms.provider.ts (M10): the package throws unconditionally under this project's vitest
// setup; the only production import site (notification-sender-factory.ts) retains its own
// "server-only" marker, so client-bundle protection is unaffected.
export interface WhatsAppCloudApiContext {
  tenantId?: string;
  userId?: string;
}

const CHANNEL = "WHATSAPP" as const;
const PROVIDER_NAME = "whatsapp-cloud-api";
const GRAPH_BASE_URL = "https://graph.facebook.com";
const REACHABILITY_TIMEOUT_MS = 5000;

// Meta's Cloud API classifies outbound media by type (image/video/document/audio) rather than a
// single generic "media" kind — a simple, documented, best-effort extension guess. A caller that
// needs a specific type unambiguously should prefer a more specific interface method in a future
// phase; this covers the common cases (school notices, report attachments) without over-building.
function guessMediaType(mediaUrl: string): "image" | "video" | "document" {
  const extension = mediaUrl.split(".").pop()?.toLowerCase().split(/[?#]/)[0];
  if (extension && ["jpg", "jpeg", "png", "webp"].includes(extension)) return "image";
  if (extension && ["mp4", "3gp"].includes(extension)) return "video";
  return "document";
}

export class WhatsAppCloudApiProvider implements WhatsAppProvider, ConfigurableProvider, HealthCheckableProvider {
  private readonly tenantId: string;
  private readonly userId: string;

  constructor(context: WhatsAppCloudApiContext = {}) {
    this.tenantId = context.tenantId ?? "unattributed-tenant";
    this.userId = context.userId ?? "system";
  }

  private messagesUrl(config: WhatsAppCloudApiConfig): string {
    return `${GRAPH_BASE_URL}/${config.apiVersion}/${config.phoneNumberId}/messages`;
  }

  private async postMessage(payload: Record<string, unknown>): Promise<WhatsAppProviderResult> {
    try {
      const config = getWhatsAppConfig();
      const response = await fetch(this.messagesUrl(config), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.accessToken}` },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`WhatsApp Cloud API responded with status ${response.status}.`);
      }
      const data = (await response.json().catch(() => ({}))) as { messages?: { id?: string }[] };
      return { status: "SENT", providerMessageId: data.messages?.[0]?.id };
    } catch (rawError) {
      const classified = classifyProviderError(rawError, CHANNEL);
      return { status: "FAILED", error: classified.safeMessage };
    }
  }

  async sendMessage(input: { to: string; message: string }): Promise<WhatsAppProviderResult> {
    return this.postMessage({
      messaging_product: "whatsapp",
      to: input.to,
      type: "text",
      text: { body: input.message },
    });
  }

  async sendTemplate(input: {
    to: string;
    templateName: string;
    variables: Record<string, string>;
  }): Promise<WhatsAppProviderResult> {
    const parameters = Object.values(input.variables).map((value) => ({ type: "text", text: value }));
    return this.postMessage({
      messaging_product: "whatsapp",
      to: input.to,
      type: "template",
      template: {
        name: input.templateName,
        language: { code: "en_US" },
        ...(parameters.length > 0 ? { components: [{ type: "body", parameters }] } : {}),
      },
    });
  }

  async sendMedia(input: { to: string; mediaUrl: string; caption?: string }): Promise<WhatsAppProviderResult> {
    const mediaType = guessMediaType(input.mediaUrl);
    return this.postMessage({
      messaging_product: "whatsapp",
      to: input.to,
      type: mediaType,
      [mediaType]: { link: input.mediaUrl, ...(input.caption ? { caption: input.caption } : {}) },
    });
  }

  // No hardcoded assumption about a dedicated Meta "health" endpoint beyond the one Meta actually
  // documents (a GET against the Business Account resource) — used purely as a reachability +
  // credential-validity check, not to inspect account-level business detail.
  private async checkAccountReachability(): Promise<void> {
    const config = getWhatsAppConfig();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REACHABILITY_TIMEOUT_MS);
    try {
      const response = await fetch(`${GRAPH_BASE_URL}/${config.apiVersion}/${config.businessAccountId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${config.accessToken}` },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`WhatsApp Cloud API responded with status ${response.status}.`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      await this.checkAccountReachability();
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
      await this.checkAccountReachability();
      logCommunicationAudit({
        tenantId: this.tenantId,
        userId: this.userId,
        action: COMMUNICATION_AUDIT_ACTIONS.PROVIDER_TEST_CONNECTION,
        provider: PROVIDER_NAME,
        channel: CHANNEL,
        status: "SUCCESS",
      });
      return { success: true, message: "WhatsApp Cloud API connection verified successfully." };
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

    if (!candidate.accessToken || typeof candidate.accessToken !== "string" || candidate.accessToken.trim() === "") {
      errors.push("accessToken is required and must be a non-empty string.");
    }
    if (!candidate.phoneNumberId || typeof candidate.phoneNumberId !== "string" || candidate.phoneNumberId.trim() === "") {
      errors.push("phoneNumberId is required and must be a non-empty string.");
    }
    if (
      !candidate.businessAccountId ||
      typeof candidate.businessAccountId !== "string" ||
      candidate.businessAccountId.trim() === ""
    ) {
      errors.push("businessAccountId is required and must be a non-empty string.");
    }
    if (candidate.apiVersion !== undefined && typeof candidate.apiVersion !== "string") {
      errors.push("apiVersion, if provided, must be a string.");
    }

    return { valid: errors.length === 0, errors };
  }
}

export { isWhatsAppConfigured };
