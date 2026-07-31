// Phase 15B Milestone M15 — a deployment-wide health summary across every registered channel. No
// UI, no Server Action, no route — a future dashboard/ops endpoint calls this directly.
//
// Deliberately has NO "server-only" marker, for the same reason as test-provider-connection
// .service.ts. Reuses each provider's own healthCheck() (which already calls
// logCommunicationAudit() internally, per Milestones M8/M10/M11) — this file adds no new audit
// logging of its own, it only orchestrates calling healthCheck() on whichever provider is
// currently active per channel and collects the results.
import { SmtpEmailProvider } from "../infrastructure/smtp-email.provider";
import { isSmtpConfigured } from "../infrastructure/smtp-env";
import { HttpSmsProvider } from "../infrastructure/http-sms.provider";
import { isSmsGatewayConfigured } from "../infrastructure/sms-env";
import { WhatsAppCloudApiProvider } from "../infrastructure/whatsapp-cloud-api.provider";
import { isWhatsAppConfigured } from "../infrastructure/whatsapp-env";
import type { NotificationChannelValue } from "../domain/notification-delivery.entity";
import type { NotificationContext } from "./notification-context";

export interface ProviderHealthSummaryItem {
  channel: NotificationChannelValue;
  providerName: string;
  // null when the channel has no real provider configured — health was never attempted, since
  // there is nothing real to check (the Unconfigured stubs don't implement HealthCheckableProvider
  // at all).
  configured: boolean;
  healthy: boolean | null;
  details?: string;
}

export async function getProviderHealthSummary(context: NotificationContext): Promise<ProviderHealthSummaryItem[]> {
  const providerContext = { tenantId: context.tenantId, userId: context.actingUserId };
  const summary: ProviderHealthSummaryItem[] = [];

  // IN_APP has no external dependency — always available, nothing to health-check.
  summary.push({ channel: "IN_APP", providerName: "in-app", configured: true, healthy: true });

  if (isSmtpConfigured()) {
    const result = await new SmtpEmailProvider(providerContext).healthCheck();
    summary.push({ channel: "EMAIL", providerName: "smtp", configured: true, healthy: result.healthy, details: result.details });
  } else {
    summary.push({ channel: "EMAIL", providerName: "unconfigured", configured: false, healthy: null });
  }

  if (isSmsGatewayConfigured()) {
    const result = await new HttpSmsProvider(providerContext).healthCheck();
    summary.push({ channel: "SMS", providerName: "http-gateway", configured: true, healthy: result.healthy, details: result.details });
  } else {
    summary.push({ channel: "SMS", providerName: "unconfigured", configured: false, healthy: null });
  }

  if (isWhatsAppConfigured()) {
    const result = await new WhatsAppCloudApiProvider(providerContext).healthCheck();
    summary.push({
      channel: "WHATSAPP",
      providerName: "whatsapp-cloud-api",
      configured: true,
      healthy: result.healthy,
      details: result.details,
    });
  } else {
    summary.push({ channel: "WHATSAPP", providerName: "unconfigured", configured: false, healthy: null });
  }

  // PUSH has no registered provider yet (Milestone-anticipated, unbuilt) — reported as
  // unconfigured/not-attempted rather than omitted, so the summary always covers every channel
  // NotificationChannel actually defines.
  summary.push({ channel: "PUSH", providerName: "unregistered", configured: false, healthy: null });

  return summary;
}
