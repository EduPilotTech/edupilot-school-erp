import "server-only";
import { PrismaUserProfileRepository } from "@/modules/users/infrastructure/prisma-user-profile.repository";
import type { EmailProvider } from "../domain/email-provider";
import type { NotificationSendInput, NotificationSendResult, NotificationSender } from "../domain/notification-sender";

// Bridges the generic EmailProvider contract into the uniform NotificationSender extension point —
// mirrors InAppNotificationSender's exact shape (see that class's own comment) but must first
// resolve the recipient's actual email address, since NotificationSendInput only ever carries the
// channel-agnostic `recipientUserProfileId`. Resolved via the tenant-scoped `findById`, matching
// every other lookup in this codebase (docs/CODING_STANDARDS.md §6) — `tenantId` is on
// `NotificationSendInput` precisely so this lookup never has to bypass tenant scoping.
export class EmailNotificationSender implements NotificationSender {
  readonly channel = "EMAIL" as const;
  private readonly userProfileRepository = new PrismaUserProfileRepository();

  constructor(private readonly provider: EmailProvider) {}

  async send(input: NotificationSendInput): Promise<NotificationSendResult> {
    const recipient = await this.userProfileRepository.findById(input.tenantId, input.recipientUserProfileId);
    if (!recipient || !recipient.email) {
      return { status: "FAILED", error: "Recipient has no email address on file." };
    }

    return this.provider.sendMail({ to: recipient.email, subject: input.title, body: input.body });
  }
}
