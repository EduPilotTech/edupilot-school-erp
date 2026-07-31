import nodemailer, { type Transporter } from "nodemailer";
import { getSmtpConfig, isSmtpConfigured, type SmtpConfig } from "./smtp-env";
import { classifyProviderError } from "../application/classify-provider-error.helpers";
import { logCommunicationAudit } from "../application/log-communication-audit.helpers";
import { COMMUNICATION_AUDIT_ACTIONS } from "../domain/communication-audit-action";
import type { EmailProvider, EmailProviderResult } from "../domain/email-provider";
import type { ConfigurableProvider, ConfigurationValidationResult, TestConnectionResult } from "../domain/configurable-provider";
import type { HealthCheckableProvider, HealthCheckResult } from "../domain/health-checkable-provider";

// Phase 15B Milestones M8/M9 — the first REAL (non-stub) EmailProvider implementation, using
// Nodemailer only, credentials read exclusively from server-side environment variables
// (smtp-env.ts) — never accepted as a constructor argument, a method parameter, or anything that
// could originate from client input. Implements EmailProvider (frozen, unchanged) plus the two
// optional interfaces from Milestone M5 (ConfigurableProvider, HealthCheckableProvider) — nothing
// about the interfaces themselves changed to accommodate this class; it simply satisfies them.
//
// Deliberately has NO "server-only" marker, for the same reason as provider-registry.ts and the
// Mock Providers (Milestones M6/M7): the `server-only` package throws unconditionally under this
// project's vitest setup (its `"react-server"` export condition is never set there), which would
// make direct unit testing of send/healthCheck/validateConfiguration impossible — exactly what
// the approved test plan for this bundle requires. This does not weaken the client-bundling
// protection: the only production import site is notification-sender-factory.ts, which retains
// its own "server-only" marker and is the sole caller that ever constructs this class — nothing
// reaches it except through that already-guarded entry point.
//
// A GENUINE ARCHITECTURAL LIMIT, documented rather than worked around: `EmailProvider.sendMail`/
// `sendAttachment`, `HealthCheckableProvider.healthCheck`, and `ConfigurableProvider
// .validateConfiguration`/`testConnection` are, by their frozen (Milestone M5) signatures,
// context-free — none of them receive a tenantId, userId, or notificationId. `logProviderFailure`
// (Milestone M3) requires both tenantId AND notificationId; `logCommunicationAudit` (Milestone M4)
// requires both tenantId AND userId. A notificationId is fundamentally per-SEND, not per-provider-
// instance, so no constructor-injected value could ever supply it honestly.
//
// Resolution: `logProviderFailure` is wired in at dispatch-to-senders.helpers.ts instead (Phase
// 15B M8/M9's own additive change there) — the one place in this codebase that genuinely holds
// both tenantId and notificationId for every channel's dispatch attempt, not duplicated per
// provider. `logCommunicationAudit` IS meaningfully callable from within this class for
// `healthCheck`/`testConnection` specifically, since this class's constructor optionally accepts
// tenant/user context to attribute those two events, defaulting to clearly-labeled "system"/
// "unattributed" sentinels for a check triggered with no real session behind it (there is no
// Test Connection UI yet to supply real values — out of scope this bundle). `validateConfiguration`
// deliberately does NOT call logCommunicationAudit: it's a pure, read-only shape check with no
// action in the approved catalogue that fits "just validating, nothing changed" — logging every
// call would be noisy without being a meaningful audit event. A future "save configuration" flow
// is the correct place to emit `PROVIDER_CONFIGURATION_UPDATED`.
export interface SmtpEmailProviderContext {
  tenantId?: string;
  userId?: string;
}

const CHANNEL = "EMAIL" as const;
const PROVIDER_NAME = "smtp";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export class SmtpEmailProvider implements EmailProvider, ConfigurableProvider, HealthCheckableProvider {
  private readonly tenantId: string;
  private readonly userId: string;
  private cachedTransporter: Transporter | null = null;

  constructor(context: SmtpEmailProviderContext = {}) {
    this.tenantId = context.tenantId ?? "unattributed-tenant";
    this.userId = context.userId ?? "system";
  }

  // Lazy: the real nodemailer transporter (and the env var read/validation it requires) is only
  // constructed the first time it's actually needed, never at provider construction — matching
  // the Provider Registry's own lazy-construction discipline (Milestone M6) one level deeper.
  private getTransporter(): Transporter {
    if (this.cachedTransporter) return this.cachedTransporter;
    const config: SmtpConfig = getSmtpConfig();
    this.cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.password },
    });
    return this.cachedTransporter;
  }

  private getFromAddress(): string {
    return getSmtpConfig().fromAddress;
  }

  async sendMail(input: { to: string; subject: string; body: string }): Promise<EmailProviderResult> {
    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail({
        from: this.getFromAddress(),
        to: input.to,
        subject: input.subject,
        html: input.body,
        text: stripHtml(input.body),
      });
      return { status: "SENT", providerMessageId: info.messageId };
    } catch (rawError) {
      const classified = classifyProviderError(rawError, CHANNEL);
      return { status: "FAILED", error: classified.safeMessage };
    }
  }

  async sendAttachment(input: {
    to: string;
    subject: string;
    body: string;
    attachment: { filename: string; content: Buffer; mimeType: string };
  }): Promise<EmailProviderResult> {
    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail({
        from: this.getFromAddress(),
        to: input.to,
        subject: input.subject,
        html: input.body,
        text: stripHtml(input.body),
        attachments: [
          {
            filename: input.attachment.filename,
            content: input.attachment.content,
            contentType: input.attachment.mimeType,
          },
        ],
      });
      return { status: "SENT", providerMessageId: info.messageId };
    } catch (rawError) {
      const classified = classifyProviderError(rawError, CHANNEL);
      return { status: "FAILED", error: classified.safeMessage };
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      await this.getTransporter().verify();
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
      await this.getTransporter().verify();
      logCommunicationAudit({
        tenantId: this.tenantId,
        userId: this.userId,
        action: COMMUNICATION_AUDIT_ACTIONS.PROVIDER_TEST_CONNECTION,
        provider: PROVIDER_NAME,
        channel: CHANNEL,
        status: "SUCCESS",
      });
      return { success: true, message: "SMTP connection verified successfully." };
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

  // Pure, synchronous, no I/O — validates the SHAPE of a would-be SMTP configuration (e.g. for an
  // admin settings form, out of scope to build this bundle) without ever attempting a real
  // connection. Never logs — see this class's own top comment for why.
  validateConfiguration(config: unknown): ConfigurationValidationResult {
    if (typeof config !== "object" || config === null) {
      return { valid: false, errors: ["Configuration must be an object."] };
    }
    const candidate = config as Record<string, unknown>;
    const errors: string[] = [];

    if (!candidate.host || typeof candidate.host !== "string" || candidate.host.trim() === "") {
      errors.push("host is required and must be a non-empty string.");
    }
    if (
      candidate.port === undefined ||
      typeof candidate.port !== "number" ||
      !Number.isInteger(candidate.port) ||
      candidate.port <= 0
    ) {
      errors.push("port is required and must be a positive integer.");
    }
    if (!candidate.user || typeof candidate.user !== "string" || candidate.user.trim() === "") {
      errors.push("user is required and must be a non-empty string.");
    }
    if (!candidate.password || typeof candidate.password !== "string" || candidate.password.trim() === "") {
      errors.push("password is required and must be a non-empty string.");
    }
    if (!candidate.fromAddress || typeof candidate.fromAddress !== "string" || candidate.fromAddress.trim() === "") {
      errors.push("fromAddress is required and must be a non-empty string.");
    }
    if (candidate.secure !== undefined && typeof candidate.secure !== "boolean") {
      errors.push("secure, if provided, must be a boolean.");
    }

    return { valid: errors.length === 0, errors };
  }
}

export { isSmtpConfigured };
