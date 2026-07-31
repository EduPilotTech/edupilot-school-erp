// Genuinely new this phase (Phase 15A) — see email-provider.ts's own comment for the shape
// rationale (one interface, swappable providers, no real SMS gateway integrated this phase).
export interface SMSProviderResult {
  status: "SENT" | "FAILED";
  providerMessageId?: string;
  error?: string;
}

export interface SMSProvider {
  sendSMS(input: { to: string; message: string }): Promise<SMSProviderResult>;
}
