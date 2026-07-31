// Genuinely new this phase (Phase 15A) — a TypeScript-only application/domain-layer contract for
// sending real email, with no schema footprint of its own. Mirrors lib/storage/storage-service.ts's
// "one interface, swappable providers" precedent: application code (EmailNotificationSender) only
// ever depends on this interface, never a concrete SMTP/SES/SendGrid SDK. Per this phase's explicit
// scope, no real integration is implemented — only this interface plus a not-yet-configured stub
// (see modules/communication/infrastructure/unconfigured-email.provider.ts).
export interface EmailProviderResult {
  status: "SENT" | "FAILED";
  providerMessageId?: string;
  error?: string;
}

export interface EmailProvider {
  sendMail(input: { to: string; subject: string; body: string }): Promise<EmailProviderResult>;
  sendAttachment(input: {
    to: string;
    subject: string;
    body: string;
    attachment: { filename: string; content: Buffer; mimeType: string };
  }): Promise<EmailProviderResult>;
}
