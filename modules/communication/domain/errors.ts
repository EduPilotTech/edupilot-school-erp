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
