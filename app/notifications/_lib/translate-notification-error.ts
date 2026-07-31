import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import {
  NotificationNotFoundError,
  NotificationTemplateNotFoundError,
  NotificationTemplateAlreadyExistsError,
  NotificationQueueEntryNotFoundError,
  NotificationQueueEntryNotPendingError,
  NotificationQueueEntryNotFailedError,
  NotificationQueueRetryLimitExceededError,
} from "@/modules/communication/domain/errors";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// instanceof-only, matching every other translateXError in this codebase (docs/CODING_STANDARDS.md
// §5). Unexpected errors are rethrown, never swallowed.
export function translateNotificationError(error: unknown): ActionResult<never> {
  if (error instanceof NotificationTemplateAlreadyExistsError) {
    return { success: false, error: { code: "NOTIFICATION_TEMPLATE_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof NotificationTemplateNotFoundError) {
    return { success: false, error: { code: "NOTIFICATION_TEMPLATE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof NotificationQueueEntryNotPendingError) {
    return { success: false, error: { code: "NOTIFICATION_QUEUE_ENTRY_NOT_PENDING", message: error.message } };
  }
  if (error instanceof NotificationQueueEntryNotFailedError) {
    return { success: false, error: { code: "NOTIFICATION_QUEUE_ENTRY_NOT_FAILED", message: error.message } };
  }
  if (error instanceof NotificationQueueRetryLimitExceededError) {
    return { success: false, error: { code: "NOTIFICATION_QUEUE_RETRY_LIMIT_EXCEEDED", message: error.message } };
  }
  if (error instanceof NotificationQueueEntryNotFoundError) {
    return { success: false, error: { code: "NOTIFICATION_QUEUE_ENTRY_NOT_FOUND", message: error.message } };
  }
  if (error instanceof NotificationNotFoundError) {
    return { success: false, error: { code: "NOTIFICATION_NOT_FOUND", message: error.message } };
  }
  if (error instanceof NotFoundError) {
    return { success: false, error: { code: "NOT_FOUND", message: error.message } };
  }
  if (error instanceof BusinessRuleError) {
    return { success: false, error: { code: "BUSINESS_RULE_VIOLATION", message: error.message } };
  }
  if (error instanceof ValidationError) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: error.message } };
  }

  throw error;
}
