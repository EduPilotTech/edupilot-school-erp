import "server-only";
import type { EmailProvider, EmailProviderResult } from "../domain/email-provider";

// The only EmailProvider implementation this phase — per Phase 15A's explicit scope ("Provider
// Interfaces only, do NOT integrate any real API"), this is an honest "not configured" stub, never
// a fake success. Every method fails with a specific, debuggable error rather than silently
// pretending an unconfigured channel delivered — the exact reasoning documented in
// prisma/schema.prisma's Phase 15A comment block. This still lets the whole Template -> Queue ->
// Send pipeline (modules/communication/application/notification-queue.service.ts) be exercised
// end-to-end without lying about delivery.
export class UnconfiguredEmailProvider implements EmailProvider {
  async sendMail(): Promise<EmailProviderResult> {
    return { status: "FAILED", error: "Email provider is not configured for this tenant." };
  }

  async sendAttachment(): Promise<EmailProviderResult> {
    return { status: "FAILED", error: "Email provider is not configured for this tenant." };
  }
}
