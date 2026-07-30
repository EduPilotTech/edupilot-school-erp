import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import { StudentNotFoundError, StudentNotEnrolledInSessionError } from "@/modules/students/domain/errors";
import {
  LibraryNotFoundError,
  LibraryAlreadyExistsError,
  LibrarySettingsNotFoundError,
  BookCategoryNotFoundError,
  BookCategoryAlreadyExistsError,
  AuthorNotFoundError,
  PublisherNotFoundError,
  BookNotFoundError,
  RackNotFoundError,
  RackAlreadyExistsError,
  ShelfNotFoundError,
  ShelfAlreadyExistsError,
  BookCopyNotFoundError,
  BookCopyAlreadyExistsError,
  BookCopyNotAvailableError,
  BookCopyHasOpenIssueError,
  BookIssueNotFoundError,
  BookIssueNotOpenError,
  MemberNotFoundError,
  MemberBorrowLimitExceededError,
  RenewalLimitExceededError,
  BookReservationNotFoundError,
  BookReservationNotPendingError,
  DuplicateReservationError,
  InvoiceAlreadyGeneratedForIssueError,
  FineNotApplicableError,
  InvalidLibraryOperationError,
} from "@/modules/library/domain/errors";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Shared by every app/library/**/actions.ts file — instanceof-only, matching
// translateHostelError.ts's own precedent (docs/CODING_STANDARDS.md §5). Unexpected errors are
// rethrown, never swallowed.
export function translateLibraryError(error: unknown): ActionResult<never> {
  if (error instanceof StudentNotFoundError) {
    return { success: false, error: { code: "STUDENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof StudentNotEnrolledInSessionError) {
    return { success: false, error: { code: "STUDENT_NOT_ENROLLED", message: error.message } };
  }
  if (error instanceof LibraryAlreadyExistsError) {
    return { success: false, error: { code: "LIBRARY_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof LibraryNotFoundError) {
    return { success: false, error: { code: "LIBRARY_NOT_FOUND", message: error.message } };
  }
  if (error instanceof LibrarySettingsNotFoundError) {
    return { success: false, error: { code: "LIBRARY_SETTINGS_NOT_FOUND", message: error.message } };
  }
  if (error instanceof BookCategoryAlreadyExistsError) {
    return { success: false, error: { code: "BOOK_CATEGORY_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof BookCategoryNotFoundError) {
    return { success: false, error: { code: "BOOK_CATEGORY_NOT_FOUND", message: error.message } };
  }
  if (error instanceof AuthorNotFoundError) {
    return { success: false, error: { code: "AUTHOR_NOT_FOUND", message: error.message } };
  }
  if (error instanceof PublisherNotFoundError) {
    return { success: false, error: { code: "PUBLISHER_NOT_FOUND", message: error.message } };
  }
  if (error instanceof BookNotFoundError) {
    return { success: false, error: { code: "BOOK_NOT_FOUND", message: error.message } };
  }
  if (error instanceof RackAlreadyExistsError) {
    return { success: false, error: { code: "RACK_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof RackNotFoundError) {
    return { success: false, error: { code: "RACK_NOT_FOUND", message: error.message } };
  }
  if (error instanceof ShelfAlreadyExistsError) {
    return { success: false, error: { code: "SHELF_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof ShelfNotFoundError) {
    return { success: false, error: { code: "SHELF_NOT_FOUND", message: error.message } };
  }
  if (error instanceof BookCopyAlreadyExistsError) {
    return { success: false, error: { code: "BOOK_COPY_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof BookCopyNotAvailableError) {
    return { success: false, error: { code: "BOOK_COPY_NOT_AVAILABLE", message: error.message } };
  }
  if (error instanceof BookCopyHasOpenIssueError) {
    return { success: false, error: { code: "BOOK_COPY_HAS_OPEN_ISSUE", message: error.message } };
  }
  if (error instanceof BookCopyNotFoundError) {
    return { success: false, error: { code: "BOOK_COPY_NOT_FOUND", message: error.message } };
  }
  if (error instanceof BookIssueNotOpenError) {
    return { success: false, error: { code: "BOOK_ISSUE_NOT_OPEN", message: error.message } };
  }
  if (error instanceof BookIssueNotFoundError) {
    return { success: false, error: { code: "BOOK_ISSUE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof MemberBorrowLimitExceededError) {
    return { success: false, error: { code: "MEMBER_BORROW_LIMIT_EXCEEDED", message: error.message } };
  }
  if (error instanceof MemberNotFoundError) {
    return { success: false, error: { code: "MEMBER_NOT_FOUND", message: error.message } };
  }
  if (error instanceof RenewalLimitExceededError) {
    return { success: false, error: { code: "RENEWAL_LIMIT_EXCEEDED", message: error.message } };
  }
  if (error instanceof DuplicateReservationError) {
    return { success: false, error: { code: "DUPLICATE_RESERVATION", message: error.message } };
  }
  if (error instanceof BookReservationNotPendingError) {
    return { success: false, error: { code: "BOOK_RESERVATION_NOT_PENDING", message: error.message } };
  }
  if (error instanceof BookReservationNotFoundError) {
    return { success: false, error: { code: "BOOK_RESERVATION_NOT_FOUND", message: error.message } };
  }
  if (error instanceof InvoiceAlreadyGeneratedForIssueError) {
    return { success: false, error: { code: "INVOICE_ALREADY_GENERATED", message: error.message } };
  }
  if (error instanceof FineNotApplicableError) {
    return { success: false, error: { code: "FINE_NOT_APPLICABLE", message: error.message } };
  }
  if (error instanceof InvalidLibraryOperationError) {
    return { success: false, error: { code: "INVALID_LIBRARY_OPERATION", message: error.message } };
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
