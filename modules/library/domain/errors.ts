import { BusinessRuleError, NotFoundError, ValidationError } from "@/lib/errors";

export class LibraryNotFoundError extends NotFoundError {
  constructor() {
    super("Library not found.");
  }
}

export class LibraryAlreadyExistsError extends BusinessRuleError {
  constructor() {
    super("A library with this code already exists.");
  }
}

export class LibrarySettingsNotFoundError extends NotFoundError {
  constructor() {
    super("Library settings not found.");
  }
}

export class LibrarySettingsAlreadyExistError extends BusinessRuleError {
  constructor() {
    super("Settings for this library already exist.");
  }
}

export class BookCategoryNotFoundError extends NotFoundError {
  constructor() {
    super("Book category not found.");
  }
}

export class BookCategoryAlreadyExistsError extends BusinessRuleError {
  constructor() {
    super("A book category with this code already exists.");
  }
}

export class AuthorNotFoundError extends NotFoundError {
  constructor() {
    super("Author not found.");
  }
}

export class PublisherNotFoundError extends NotFoundError {
  constructor() {
    super("Publisher not found.");
  }
}

export class BookNotFoundError extends NotFoundError {
  constructor() {
    super("Book not found.");
  }
}

export class RackNotFoundError extends NotFoundError {
  constructor() {
    super("Rack not found.");
  }
}

export class RackAlreadyExistsError extends BusinessRuleError {
  constructor() {
    super("A rack with this code already exists in this library.");
  }
}

export class ShelfNotFoundError extends NotFoundError {
  constructor() {
    super("Shelf not found.");
  }
}

export class ShelfAlreadyExistsError extends BusinessRuleError {
  constructor() {
    super("A shelf with this code already exists on this rack.");
  }
}

export class BookCopyNotFoundError extends NotFoundError {
  constructor() {
    super("Book copy not found.");
  }
}

export class BookCopyAlreadyExistsError extends BusinessRuleError {
  constructor() {
    super("A copy with this accession number already exists.");
  }
}

export class BookCopyNotAvailableError extends BusinessRuleError {
  constructor() {
    super("This book copy is not available for issue.");
  }
}

export class BookCopyHasOpenIssueError extends BusinessRuleError {
  constructor() {
    super("This book copy cannot be modified while it is issued or reserved.");
  }
}

export class BookIssueNotFoundError extends NotFoundError {
  constructor() {
    super("Book issue not found.");
  }
}

export class BookIssueNotOpenError extends BusinessRuleError {
  constructor(message = "This book issue has already been closed.") {
    super(message);
  }
}

export class MemberNotFoundError extends NotFoundError {
  constructor() {
    super("Member not found.");
  }
}

export class MemberBorrowLimitExceededError extends BusinessRuleError {
  constructor() {
    super("This member has reached their maximum number of issued books.");
  }
}

export class RenewalLimitExceededError extends BusinessRuleError {
  constructor() {
    super("This book has already reached its maximum number of renewals.");
  }
}

export class BookReservationNotFoundError extends NotFoundError {
  constructor() {
    super("Reservation not found.");
  }
}

export class BookReservationNotPendingError extends BusinessRuleError {
  constructor(message = "This reservation is no longer pending.") {
    super(message);
  }
}

export class DuplicateReservationError extends BusinessRuleError {
  constructor() {
    super("This member already has a pending reservation for this book.");
  }
}

export class InvoiceAlreadyGeneratedForIssueError extends BusinessRuleError {
  constructor() {
    super("A fine invoice has already been generated for this book issue.");
  }
}

export class FineNotApplicableError extends BusinessRuleError {
  constructor(message = "No fine applies to this book issue.") {
    super(message);
  }
}

export class InvalidLibraryOperationError extends ValidationError {
  constructor(message: string) {
    super(message);
  }
}
