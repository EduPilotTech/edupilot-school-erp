import "server-only";
import type { WhatsAppProvider, WhatsAppProviderResult } from "../domain/whatsapp-provider";

// The only WhatsAppProvider implementation this phase — see unconfigured-email.provider.ts's own
// comment for the "honest failure, never a fake success" rationale.
export class UnconfiguredWhatsAppProvider implements WhatsAppProvider {
  async sendMessage(): Promise<WhatsAppProviderResult> {
    return { status: "FAILED", error: "WhatsApp provider is not configured for this tenant." };
  }

  async sendTemplate(): Promise<WhatsAppProviderResult> {
    return { status: "FAILED", error: "WhatsApp provider is not configured for this tenant." };
  }

  async sendMedia(): Promise<WhatsAppProviderResult> {
    return { status: "FAILED", error: "WhatsApp provider is not configured for this tenant." };
  }
}
