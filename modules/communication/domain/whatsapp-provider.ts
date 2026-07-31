// Genuinely new this phase (Phase 15A) — see email-provider.ts's own comment for the shape
// rationale (one interface, swappable providers, no real Meta WhatsApp Business API integrated
// this phase).
export interface WhatsAppProviderResult {
  status: "SENT" | "FAILED";
  providerMessageId?: string;
  error?: string;
}

export interface WhatsAppProvider {
  sendMessage(input: { to: string; message: string }): Promise<WhatsAppProviderResult>;
  sendTemplate(input: {
    to: string;
    templateName: string;
    variables: Record<string, string>;
  }): Promise<WhatsAppProviderResult>;
  sendMedia(input: { to: string; mediaUrl: string; caption?: string }): Promise<WhatsAppProviderResult>;
}
