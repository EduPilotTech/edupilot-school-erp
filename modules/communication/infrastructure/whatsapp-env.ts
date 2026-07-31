// Phase 15B Milestone M11 — server-side-only WhatsApp Cloud API configuration access. Mirrors
// smtp-env.ts's / sms-env.ts's exact pattern: each getter validates and returns exactly one
// variable, throwing only when actually called, never at import time.
function requireEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Configure the WhatsApp Cloud API ` +
        "credentials (access token, phone number id, business account id) on the server before " +
        "using the WhatsApp provider."
    );
  }
  return value;
}

export interface WhatsAppCloudApiConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  apiVersion: string;
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
  );
}

export function getWhatsAppConfig(): WhatsAppCloudApiConfig {
  const accessToken = requireEnvVar("WHATSAPP_ACCESS_TOKEN", process.env.WHATSAPP_ACCESS_TOKEN);
  const phoneNumberId = requireEnvVar("WHATSAPP_PHONE_NUMBER_ID", process.env.WHATSAPP_PHONE_NUMBER_ID);
  const businessAccountId = requireEnvVar("WHATSAPP_BUSINESS_ACCOUNT_ID", process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v18.0";
  return { accessToken, phoneNumberId, businessAccountId, apiVersion };
}
