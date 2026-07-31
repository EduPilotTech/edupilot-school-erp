import "server-only";
import { ProviderRegistry } from "../application/provider-registry";
import { InAppNotificationSender } from "./in-app-notification.sender";
import { EmailNotificationSender } from "./email-notification.sender";
import { SmsNotificationSender } from "./sms-notification.sender";
import { WhatsAppNotificationSender } from "./whatsapp-notification.sender";
import { UnconfiguredEmailProvider } from "./unconfigured-email.provider";
import { UnconfiguredSmsProvider } from "./unconfigured-sms.provider";
import { UnconfiguredWhatsAppProvider } from "./unconfigured-whatsapp.provider";
import { SmtpEmailProvider } from "./smtp-email.provider";
import { isSmtpConfigured } from "./smtp-env";
import { HttpSmsProvider } from "./http-sms.provider";
import { isSmsGatewayConfigured } from "./sms-env";
import { WhatsAppCloudApiProvider } from "./whatsapp-cloud-api.provider";
import { isWhatsAppConfigured } from "./whatsapp-env";
import type { NotificationSender } from "../domain/notification-sender";
import type { NotificationChannelValue } from "../domain/notification-delivery.entity";

// Provider Factory (Phase 15A) -> Provider Registry (Phase 15B Milestone M6). The single place
// that decides which concrete Provider backs each channel's NotificationSender — now backed by
// the registry mechanism (provider-registry.ts) instead of a hardcoded array literal. Registering
// a new real provider (SMTP/SendGrid/Mailgun/AWS SES/Twilio/MSG91/WhatsApp Cloud API/Push,
// Milestone M8+) means one new `notificationSenderRegistry.register(...)` call plus one entry in
// `ACTIVE_PROVIDER_BY_CHANNEL` below — never touching `getActiveNotificationSenders()`'s own body,
// and never touching a caller (dispatch-notification.helpers.ts and notification-queue.service
// .ts's processQueueEntry both only ever depend on this function + the NotificationSender
// interface).
export const notificationSenderRegistry = new ProviderRegistry();

notificationSenderRegistry.register("IN_APP", "in-app", () => new InAppNotificationSender());
notificationSenderRegistry.register("EMAIL", "unconfigured", () => new EmailNotificationSender(new UnconfiguredEmailProvider()));
notificationSenderRegistry.register("SMS", "unconfigured", () => new SmsNotificationSender(new UnconfiguredSmsProvider()));
notificationSenderRegistry.register(
  "WHATSAPP",
  "unconfigured",
  () => new WhatsAppNotificationSender(new UnconfiguredWhatsAppProvider())
);
// Phase 15B Milestones M8/M9 — the first real provider registered alongside the stub. Registering
// it costs exactly this one call; `EmailNotificationSender` (frozen, unchanged) wraps it exactly
// like it already wraps `UnconfiguredEmailProvider` — the whole point of the Provider interface
// being the dependency, never a concrete class.
notificationSenderRegistry.register("EMAIL", "smtp", () => new EmailNotificationSender(new SmtpEmailProvider()));
// Phase 15B Milestones M10/M11 — same pattern: registered alongside each channel's stub, activated
// automatically once configured (see the resolver functions below).
notificationSenderRegistry.register("SMS", "http-gateway", () => new SmsNotificationSender(new HttpSmsProvider()));
notificationSenderRegistry.register(
  "WHATSAPP",
  "whatsapp-cloud-api",
  () => new WhatsAppNotificationSender(new WhatsAppCloudApiProvider())
);

// Which registered provider is "active" per channel today — a hardcoded default until real
// per-tenant or deployment-wide provider configuration exists (the Database Review's
// conditionally-recommended `NotificationProviderConfig`, out of scope for this bundle). Swapping
// a channel to a real provider later means changing one value here, once that provider is
// registered above.
const STATIC_ACTIVE_PROVIDER_BY_CHANNEL: Record<"IN_APP", string> = {
  IN_APP: "in-app",
};

// EMAIL/SMS/WHATSAPP are each resolved dynamically rather than hardcoded: if the corresponding
// real provider has been configured via environment variables, it becomes the active provider
// automatically; otherwise the deployment falls back to the honest "unconfigured" stub exactly as
// before. This is what "preserve backward compatibility" means in practice — a deployment that
// has never set any of these variables sees zero behavior change, while one that has configured
// them gets real delivery with no separate activation step (no Test Connection UI or
// provider-config table exists yet to drive this decision any other way — out of scope so far).
function resolveActiveEmailProviderName(): string {
  return isSmtpConfigured() ? "smtp" : "unconfigured";
}

function resolveActiveSmsProviderName(): string {
  return isSmsGatewayConfigured() ? "http-gateway" : "unconfigured";
}

function resolveActiveWhatsAppProviderName(): string {
  return isWhatsAppConfigured() ? "whatsapp-cloud-api" : "unconfigured";
}

// Public signature and behavior UNCHANGED from Phase 15A — still synchronous, still returns
// exactly 4 senders in the same order every time (PUSH remains unregistered/undispatched, exactly
// as before). Only the internals moved from `new X()` literals to registry-backed resolution.
export function getActiveNotificationSenders(): NotificationSender[] {
  return [
    notificationSenderRegistry.resolve("IN_APP", STATIC_ACTIVE_PROVIDER_BY_CHANNEL.IN_APP),
    notificationSenderRegistry.resolve("EMAIL", resolveActiveEmailProviderName()),
    notificationSenderRegistry.resolve("SMS", resolveActiveSmsProviderName()),
    notificationSenderRegistry.resolve("WHATSAPP", resolveActiveWhatsAppProviderName()),
  ];
}

// Phase 15B Milestone M12 — Queue Integration. Exposes which REGISTRY-resolved provider name is
// active for a given channel, so dispatch-to-senders.helpers.ts's failure logging can record the
// actual provider (e.g. "smtp") instead of a generic channel-derived guess — closing a
// simplification Milestone M8's own report explicitly flagged. Also the one place M15's aggregated
// health-check summary needs, to know which concrete provider instance to health-check per
// channel.
export function getActiveProviderName(channel: NotificationChannelValue): string {
  switch (channel) {
    case "IN_APP":
      return STATIC_ACTIVE_PROVIDER_BY_CHANNEL.IN_APP;
    case "EMAIL":
      return resolveActiveEmailProviderName();
    case "SMS":
      return resolveActiveSmsProviderName();
    case "WHATSAPP":
      return resolveActiveWhatsAppProviderName();
    case "PUSH":
      return "unregistered";
  }
}
