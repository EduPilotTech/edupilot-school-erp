// Phase 15B Milestone M10 — server-side-only SMS gateway configuration access. Mirrors
// smtp-env.ts's / lib/supabase/env.ts's exact pattern: each getter validates and returns exactly
// one variable, throwing only when actually called, never at import time.
//
// Deliberately generic, vendor-neutral variable names (SMS_GATEWAY_*, not e.g. TWILIO_*) — this
// bundle ships ONE production HTTP-based gateway implementation with clean extension points
// (http-sms.provider.ts's injectable request builder), not a specific vendor SDK. A future
// MSG91/Twilio/Textlocal/Fast2SMS integration reuses these same three variables (a gateway is
// fundamentally a URL + an API key + an optional sender id) or introduces its own env vars
// alongside them without touching this file.
function requireEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Configure the SMS gateway (URL, API key) ` +
        "on the server before using the SMS provider."
    );
  }
  return value;
}

export interface SmsGatewayConfig {
  apiUrl: string;
  apiKey: string;
  senderId?: string;
}

export function isSmsGatewayConfigured(): boolean {
  return Boolean(process.env.SMS_GATEWAY_API_URL && process.env.SMS_GATEWAY_API_KEY);
}

export function getSmsGatewayConfig(): SmsGatewayConfig {
  const apiUrl = requireEnvVar("SMS_GATEWAY_API_URL", process.env.SMS_GATEWAY_API_URL);
  const apiKey = requireEnvVar("SMS_GATEWAY_API_KEY", process.env.SMS_GATEWAY_API_KEY);
  const senderId = process.env.SMS_GATEWAY_SENDER_ID || undefined;
  return { apiUrl, apiKey, senderId };
}
