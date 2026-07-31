// Phase 15B Milestone M14 — backend Test Connection services for Email, SMS, and WhatsApp. No
// UI, no Server Action, no route — explicitly out of scope this bundle (mirrors every prior
// milestone's own "Test Connection UI" exclusion). A future UI/Server Action calls these directly.
//
// Deliberately has NO "server-only" marker — same reasoning as every provider class it depends on
// (M8/M10/M11): these providers are marker-free so they stay directly unit-testable, and this
// orchestration layer inherits that same need. The only production import site would be a future
// Server Action, which would carry its own "server-only"-equivalent boundary (Next.js Server
// Actions are inherently server-only by the framework itself).
//
// Each function checks whether its channel is actually configured BEFORE attempting anything —
// the Unconfigured stubs deliberately do NOT implement ConfigurableProvider/HealthCheckableProvider
// at all (there is nothing real to test), so testing an unconfigured channel returns an honest
// "not configured" result rather than attempting to call a method that doesn't exist on the stub.
import { SmtpEmailProvider } from "../infrastructure/smtp-email.provider";
import { isSmtpConfigured } from "../infrastructure/smtp-env";
import { HttpSmsProvider } from "../infrastructure/http-sms.provider";
import { isSmsGatewayConfigured } from "../infrastructure/sms-env";
import { WhatsAppCloudApiProvider } from "../infrastructure/whatsapp-cloud-api.provider";
import { isWhatsAppConfigured } from "../infrastructure/whatsapp-env";
import type { TestConnectionResult } from "../domain/configurable-provider";
import type { NotificationContext } from "./notification-context";

const NOT_CONFIGURED_RESULT = (channelLabel: string): TestConnectionResult => ({
  success: false,
  message: `${channelLabel} provider is not configured for this deployment.`,
});

export async function testEmailProviderConnection(context: NotificationContext): Promise<TestConnectionResult> {
  if (!isSmtpConfigured()) return NOT_CONFIGURED_RESULT("Email");
  const provider = new SmtpEmailProvider({ tenantId: context.tenantId, userId: context.actingUserId });
  return provider.testConnection();
}

export async function testSmsProviderConnection(context: NotificationContext): Promise<TestConnectionResult> {
  if (!isSmsGatewayConfigured()) return NOT_CONFIGURED_RESULT("SMS");
  const provider = new HttpSmsProvider({ tenantId: context.tenantId, userId: context.actingUserId });
  return provider.testConnection();
}

export async function testWhatsAppProviderConnection(context: NotificationContext): Promise<TestConnectionResult> {
  if (!isWhatsAppConfigured()) return NOT_CONFIGURED_RESULT("WhatsApp");
  const provider = new WhatsAppCloudApiProvider({ tenantId: context.tenantId, userId: context.actingUserId });
  return provider.testConnection();
}
