import "server-only";
import { PrismaUserProfileRepository } from "@/modules/users/infrastructure/prisma-user-profile.repository";
import type { SMSProvider } from "../domain/sms-provider";
import type { NotificationSendInput, NotificationSendResult, NotificationSender } from "../domain/notification-sender";

// Bridges the generic SMSProvider contract into the uniform NotificationSender extension point —
// see email-notification.sender.ts's own comment: recipient resolution is tenant-scoped via
// `findById`, matching every other lookup in this codebase.
export class SmsNotificationSender implements NotificationSender {
  readonly channel = "SMS" as const;
  private readonly userProfileRepository = new PrismaUserProfileRepository();

  constructor(private readonly provider: SMSProvider) {}

  async send(input: NotificationSendInput): Promise<NotificationSendResult> {
    const recipient = await this.userProfileRepository.findById(input.tenantId, input.recipientUserProfileId);
    if (!recipient || !recipient.phone) {
      return { status: "FAILED", error: "Recipient has no phone number on file." };
    }

    return this.provider.sendSMS({ to: recipient.phone, message: input.body });
  }
}
