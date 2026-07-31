import "server-only";
import { PrismaUserProfileRepository } from "@/modules/users/infrastructure/prisma-user-profile.repository";
import type { WhatsAppProvider } from "../domain/whatsapp-provider";
import type { NotificationSendInput, NotificationSendResult, NotificationSender } from "../domain/notification-sender";

// Bridges the generic WhatsAppProvider contract into the uniform NotificationSender extension
// point — see email-notification.sender.ts's own comment: recipient resolution is tenant-scoped
// via `findById`, matching every other lookup in this codebase. Uses `sendMessage` (plain text),
// not `sendTemplate`/`sendMedia` — those are reserved for producers that explicitly want a
// WhatsApp template/media message, which no caller does this phase.
export class WhatsAppNotificationSender implements NotificationSender {
  readonly channel = "WHATSAPP" as const;
  private readonly userProfileRepository = new PrismaUserProfileRepository();

  constructor(private readonly provider: WhatsAppProvider) {}

  async send(input: NotificationSendInput): Promise<NotificationSendResult> {
    const recipient = await this.userProfileRepository.findById(input.tenantId, input.recipientUserProfileId);
    if (!recipient || !recipient.phone) {
      return { status: "FAILED", error: "Recipient has no phone number on file." };
    }

    return this.provider.sendMessage({ to: recipient.phone, message: input.body });
  }
}
