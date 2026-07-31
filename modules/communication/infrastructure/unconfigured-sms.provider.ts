import "server-only";
import type { SMSProvider, SMSProviderResult } from "../domain/sms-provider";

// The only SMSProvider implementation this phase — see unconfigured-email.provider.ts's own
// comment for the "honest failure, never a fake success" rationale.
export class UnconfiguredSmsProvider implements SMSProvider {
  async sendSMS(): Promise<SMSProviderResult> {
    return { status: "FAILED", error: "SMS provider is not configured for this tenant." };
  }
}
