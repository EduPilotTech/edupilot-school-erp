import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import { ValidationError } from "@/lib/errors";
import { PrismaNotificationRepository } from "../infrastructure/prisma-notification.repository";
import { PrismaNotificationQueueRepository } from "../infrastructure/prisma-notification-queue.repository";
import { PrismaNotificationTemplateRepository } from "../infrastructure/prisma-notification-template.repository";
import { dispatchToAllSenders } from "./dispatch-to-senders.helpers";
import { renderNotificationTemplate } from "./render-notification-template.helpers";
import {
  NotificationNotFoundError,
  NotificationQueueEntryNotFailedError,
  NotificationQueueEntryNotFoundError,
  NotificationQueueEntryNotPendingError,
  NotificationTemplateNotFoundError,
} from "../domain/errors";
import { queueNotificationSchema } from "./dto/notification-queue.dto";
import type { NotificationEntity } from "../domain/notification.entity";
import type { NotificationQueueEntity } from "../domain/notification-queue.entity";
import type { NotificationContext } from "./notification-context";

const notificationRepository = new PrismaNotificationRepository();
const queueRepository = new PrismaNotificationQueueRepository();
const templateRepository = new PrismaNotificationTemplateRepository();

export interface QueuedNotificationResult {
  notification: NotificationEntity;
  queueEntry: NotificationQueueEntity;
}

// queue() — the base operation every other function in this file builds on. Creates the
// channel-agnostic Notification row (reusing PrismaNotificationRepository — never duplicating its
// creation logic) plus exactly one NotificationQueue row, atomically, in one transaction. Either
// `templateId` (+ `variables`) or `title`+`body` must resolve to non-empty content — the DTO's
// `.refine()` catches the "supplied neither" case; the check below also catches a template that
// rendered to empty content, which the DTO alone cannot see.
export async function queueNotification(
  input: unknown,
  context: NotificationContext
): Promise<QueuedNotificationResult> {
  const parsed = queueNotificationSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid notification queue data.");
  }
  const data = parsed.data;
  const { tenantId } = context;

  let title = data.title ?? null;
  let body = data.body ?? null;

  if (data.templateId) {
    const template = await templateRepository.findById(tenantId, data.templateId);
    if (!template || template.deletedAt !== null) {
      throw new NotificationTemplateNotFoundError();
    }
    const rendered = renderNotificationTemplate(
      { subject: template.subject, message: template.message },
      data.variables ?? {}
    );
    title = rendered.subject ?? template.name;
    body = rendered.message;
  }

  if (!title || !body) {
    throw new ValidationError("Either a templateId or both title and body must resolve to non-empty content.");
  }
  const resolvedTitle: string = title;
  const resolvedBody: string = body;

  const scheduledAt = data.scheduledAt ?? new Date();

  return withTenantContext(tenantId, async (tx) => {
    const notification = await notificationRepository.create(
      {
        tenantId,
        recipientUserProfileId: data.recipientUserProfileId,
        type: data.type,
        priority: data.priority,
        title: resolvedTitle,
        body: resolvedBody,
        referenceType: data.referenceType ?? null,
        referenceId: data.referenceId ?? null,
      },
      tx
    );

    const queueEntry = await queueRepository.create(
      {
        tenantId,
        notificationId: notification.id,
        scheduledAt,
      },
      tx
    );

    return { notification, queueEntry };
  });
}

// send() — queue() with `scheduledAt` forced to "now," then immediately processed before
// returning, rather than waiting for a queue processor to pick it up later.
export async function sendNotificationNow(
  input: unknown,
  context: NotificationContext
): Promise<QueuedNotificationResult> {
  const parsed = queueNotificationSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid notification queue data.");
  }

  const result = await queueNotification({ ...parsed.data, scheduledAt: new Date() }, context);
  await processQueueEntry(context.tenantId, result.queueEntry.id);
  return result;
}

// schedule() — queue() with a `scheduledAt` that must be strictly in the future; a caller wanting
// "send now" should use sendNotificationNow instead, not schedule() with `new Date()`.
export async function scheduleNotification(
  input: unknown,
  context: NotificationContext
): Promise<QueuedNotificationResult> {
  const parsed = queueNotificationSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid notification queue data.");
  }
  if (!parsed.data.scheduledAt || parsed.data.scheduledAt.getTime() <= Date.now()) {
    throw new ValidationError("scheduledAt must be strictly in the future to schedule a notification.");
  }

  return queueNotification(parsed.data, context);
}

// retry() — only a FAILED queue entry can be retried (see processQueueEntry's own comment for how
// a queue entry ever reaches FAILED). Increments retryCount, resets to PENDING with a fresh
// scheduledAt, then re-processes it immediately rather than waiting for the next queue sweep.
export async function retryNotification(notificationId: string, context: NotificationContext): Promise<void> {
  const { tenantId } = context;
  const queueEntry = await queueRepository.findByNotificationId(tenantId, notificationId);
  if (!queueEntry) throw new NotificationQueueEntryNotFoundError();
  if (queueEntry.status !== "FAILED") throw new NotificationQueueEntryNotFailedError();

  await queueRepository.update(tenantId, queueEntry.id, {
    retryCount: queueEntry.retryCount + 1,
    status: "PENDING",
    scheduledAt: new Date(),
  });

  await processQueueEntry(tenantId, queueEntry.id);
}

// cancel() — only a still-PENDING queue entry can be cancelled; once it has moved to PROCESSING
// (or beyond), cancelling is no longer meaningful — the dispatch attempt has already started.
export async function cancelNotification(notificationId: string, context: NotificationContext): Promise<void> {
  const { tenantId } = context;
  const queueEntry = await queueRepository.findByNotificationId(tenantId, notificationId);
  if (!queueEntry) throw new NotificationQueueEntryNotFoundError();
  if (queueEntry.status !== "PENDING") throw new NotificationQueueEntryNotPendingError();

  await queueRepository.update(tenantId, queueEntry.id, { status: "CANCELLED" });
}

// Internal — exported for sendNotificationNow/retryNotification above and for
// processDueNotificationQueue's batch sweep below. Dispatches an ALREADY-EXISTING Notification
// through the shared sender loop (dispatchToAllSenders — the same loop dispatchNotification.helpers.ts
// uses for a freshly-created Notification; see that file's own comment on why this is one shared
// loop, not two).
//
// Design decision: the queue entry's final status reflects "did we attempt dispatch," not "did
// every channel succeed" — individual channel success/failure already lives on NotificationDelivery
// (see that model's own comment). So a completed dispatch attempt always moves the entry to SENT,
// even when every sender returns FAILED (true for every channel this phase, since no provider is
// configured — see the Unconfigured*Provider stubs). The entry only ever reaches FAILED if
// dispatchToAllSenders itself throws (a bug, a DB failure writing NotificationDelivery, etc.) —
// that is the only path retryNotification's FAILED precondition can be reached from.
export async function processQueueEntry(
  tenantId: string,
  queueEntryId: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const queueEntry = await queueRepository.findById(tenantId, queueEntryId, tx);
  if (!queueEntry) throw new NotificationQueueEntryNotFoundError();

  const notification = await notificationRepository.findById(tenantId, queueEntry.notificationId);
  if (!notification) throw new NotificationNotFoundError();

  const run = async (client: Prisma.TransactionClient): Promise<void> => {
    await queueRepository.update(tenantId, queueEntryId, { status: "PROCESSING" }, client);

    try {
      await dispatchToAllSenders(
        tenantId,
        notification.id,
        {
          recipientUserProfileId: notification.recipientUserProfileId,
          type: notification.type,
          priority: notification.priority,
          title: notification.title,
          body: notification.body,
        },
        client
      );

      await queueRepository.update(tenantId, queueEntryId, { status: "SENT", processedAt: new Date() }, client);
    } catch (error) {
      await queueRepository.update(tenantId, queueEntryId, { status: "FAILED", processedAt: new Date() }, client);
      throw error;
    }
  };

  if (tx) {
    await run(tx);
  } else {
    await withTenantContext(tenantId, run);
  }
}

// The plain callable batch sweep the phase spec asks for — NOT a cron job, NOT wired to anything
// automatic (explicitly out of scope this phase: "No Webhooks, No External API"). A future phase
// decides how this gets invoked (a manual admin action, or eventually a scheduled job). One
// entry's failure does not abort the rest of the batch -- it is already recorded FAILED by
// processQueueEntry itself before this loop moves on.
export async function processDueNotificationQueue(tenantId: string): Promise<void> {
  const dueEntries = await queueRepository.findDue(tenantId, new Date());
  for (const entry of dueEntries) {
    try {
      await processQueueEntry(tenantId, entry.id);
    } catch {
      // Already recorded as FAILED by processQueueEntry; continue draining the rest of the batch.
    }
  }
}
