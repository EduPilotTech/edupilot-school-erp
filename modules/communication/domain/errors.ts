import { BusinessRuleError, NotFoundError } from "@/lib/errors";

export class HomeworkNotFoundError extends NotFoundError {
  constructor(message = "Homework not found.") {
    super(message);
  }
}

export class NoticeNotFoundError extends NotFoundError {
  constructor(message = "Notice not found.") {
    super(message);
  }
}

export class CalendarEventNotFoundError extends NotFoundError {
  constructor(message = "Calendar event not found.") {
    super(message);
  }
}

export class MessageThreadNotFoundError extends NotFoundError {
  constructor(message = "Message thread not found.") {
    super(message);
  }
}

export class MessageThreadInactiveError extends BusinessRuleError {
  constructor(message = "This message thread is no longer active.") {
    super(message);
  }
}

export class NotificationNotFoundError extends NotFoundError {
  constructor(message = "Notification not found.") {
    super(message);
  }
}

// --- NotificationTemplate (Phase 15A) ---------------------------------------------------------

export class NotificationTemplateNotFoundError extends NotFoundError {
  constructor(message = "Notification template not found.") {
    super(message);
  }
}

export class NotificationTemplateAlreadyExistsError extends BusinessRuleError {
  constructor(message = "A notification template with this name and channel already exists.") {
    super(message);
  }
}

// --- NotificationQueue (Phase 15A) ------------------------------------------------------------

export class NotificationQueueEntryNotFoundError extends NotFoundError {
  constructor(message = "Notification queue entry not found.") {
    super(message);
  }
}

export class NotificationQueueEntryNotPendingError extends BusinessRuleError {
  constructor(message = "This notification is not pending dispatch and cannot be cancelled.") {
    super(message);
  }
}

export class NotificationQueueEntryNotFailedError extends BusinessRuleError {
  constructor(message = "This notification has not failed dispatch and cannot be retried.") {
    super(message);
  }
}
