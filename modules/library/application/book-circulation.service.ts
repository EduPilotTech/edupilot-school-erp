import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { PrismaBookCopyRepository } from "../infrastructure/prisma-book-copy.repository";
import { PrismaBookRepository } from "../infrastructure/prisma-book.repository";
import { PrismaBookIssueRepository } from "../infrastructure/prisma-book-issue.repository";
import { PrismaBookReservationRepository } from "../infrastructure/prisma-book-reservation.repository";
import {
  BookCopyNotAvailableError,
  BookCopyNotFoundError,
  BookIssueNotFoundError,
  BookIssueNotOpenError,
  BookNotFoundError,
  MemberBorrowLimitExceededError,
  RenewalLimitExceededError,
} from "../domain/errors";
import { assertMemberExists, getMemberBorrowLimit } from "./library-member.helpers";
import { notifyLibraryMember } from "./library-notification.helpers";
import { getLibrarySettings } from "./library-settings.service";
import {
  issueBookSchema,
  markBookDamagedSchema,
  markBookLostSchema,
  renewBookIssueSchema,
  returnBookSchema,
  type BookIssueDTO,
} from "./dto/circulation.dto";
import type { BookIssueEntity } from "../domain/book-issue.entity";
import type { LibraryContext } from "./library.service";

function toDTO(entity: BookIssueEntity): BookIssueDTO {
  return {
    id: entity.id,
    bookCopyId: entity.bookCopyId,
    libraryId: entity.libraryId,
    memberType: entity.memberType,
    memberId: entity.memberId,
    issueDate: entity.issueDate.toISOString().slice(0, 10),
    dueDate: entity.dueDate.toISOString().slice(0, 10),
    returnDate: entity.returnDate ? entity.returnDate.toISOString().slice(0, 10) : null,
    status: entity.status,
    renewalCount: entity.renewalCount,
    issuedBy: entity.issuedBy,
    returnedBy: entity.returnedBy,
    fineWaived: entity.fineWaived,
    fineWaivedReason: entity.fineWaivedReason,
  };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Book Issue — the first checkout of a copy. Atomically creates the BookIssue row and flips the
// copy to ISSUED (mirrors checkInStudentHostel's own "create + flip status" transaction shape).
export async function issueBook(input: unknown, context: LibraryContext): Promise<BookIssueDTO> {
  const parsed = issueBookSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid issue data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const copyRepository = new PrismaBookCopyRepository();
  const copy = await copyRepository.findById(tenantId, data.bookCopyId);
  if (!copy || copy.deletedAt !== null) throw new BookCopyNotFoundError();
  if (copy.status !== "AVAILABLE") throw new BookCopyNotAvailableError();

  const bookRepository = new PrismaBookRepository();
  const book = await bookRepository.findById(tenantId, copy.bookId);
  if (!book || book.deletedAt !== null) throw new BookNotFoundError();

  await assertMemberExists(tenantId, data.memberType, data.memberId);

  const settings = await getLibrarySettings(tenantId, book.libraryId);
  const issueRepository = new PrismaBookIssueRepository();
  const openForMember = await issueRepository.findOpenByMember(tenantId, data.memberType, data.memberId);
  const limit = getMemberBorrowLimit(data.memberType, settings);
  if (openForMember.length >= limit) throw new MemberBorrowLimitExceededError();

  const dueDate = data.dueDate ?? addDays(data.issueDate, settings.defaultLoanPeriodDays);

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const issue = await issueRepository.create(
      {
        tenantId,
        bookCopyId: data.bookCopyId,
        libraryId: book.libraryId,
        memberType: data.memberType,
        memberId: data.memberId,
        issueDate: data.issueDate,
        dueDate,
        issuedBy: actingUserId,
        createdBy: actingUserId,
      },
      tx
    );
    await copyRepository.setStatus(tenantId, data.bookCopyId, "ISSUED", tx);

    await notifyLibraryMember(
      tenantId,
      data.memberType,
      data.memberId,
      {
        title: `"${book.title}" issued`,
        body: `Due back on ${issue.dueDate.toISOString().slice(0, 10)}.`,
        referenceType: "BookIssue",
        referenceId: issue.id,
      },
      tx
    );

    return toDTO(issue);
  });
}

// Renewal extends the SAME still-open row's dueDate/renewalCount — it never creates a new row
// (see the module's own section-header comment for why this differs from a hostel Transfer).
export async function renewBookIssue(issueId: string, input: unknown, context: LibraryContext): Promise<BookIssueDTO> {
  const parsed = renewBookIssueSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid renewal data.");
  }
  const { tenantId, actingUserId } = context;

  const issueRepository = new PrismaBookIssueRepository();
  const issue = await issueRepository.findById(tenantId, issueId);
  if (!issue) throw new BookIssueNotFoundError();
  if (issue.status !== "ISSUED") throw new BookIssueNotOpenError();

  const bookRepository = new PrismaBookRepository();
  const copyRepository = new PrismaBookCopyRepository();
  const copy = await copyRepository.findById(tenantId, issue.bookCopyId);
  if (!copy) throw new BookCopyNotFoundError();
  const book = await bookRepository.findById(tenantId, copy.bookId);
  if (!book) throw new BookNotFoundError();

  const settings = await getLibrarySettings(tenantId, book.libraryId);
  if (issue.renewalCount >= settings.maxRenewalCount) throw new RenewalLimitExceededError();

  const newDueDate = parsed.data.newDueDate ?? addDays(issue.dueDate, settings.defaultLoanPeriodDays);
  const renewed = await issueRepository.renew(tenantId, issueId, {
    dueDate: newDueDate,
    renewalCount: issue.renewalCount + 1,
    updatedBy: actingUserId,
  });
  return toDTO(renewed);
}

// Book Return — closes the BookIssue (status=RETURNED) and frees the copy back to AVAILABLE.
export async function returnBook(issueId: string, input: unknown, context: LibraryContext): Promise<BookIssueDTO> {
  const parsed = returnBookSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid return data.");
  }
  const { tenantId, actingUserId } = context;

  const issueRepository = new PrismaBookIssueRepository();
  const issue = await issueRepository.findById(tenantId, issueId);
  if (!issue) throw new BookIssueNotFoundError();
  if (issue.status !== "ISSUED") throw new BookIssueNotOpenError();

  const copyRepository = new PrismaBookCopyRepository();
  const bookRepository = new PrismaBookRepository();
  const copy = await copyRepository.findById(tenantId, issue.bookCopyId);
  const book = copy ? await bookRepository.findById(tenantId, copy.bookId) : null;

  const reservationRepository = new PrismaBookReservationRepository();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const closed = await issueRepository.close(
      tenantId,
      issueId,
      { status: "RETURNED", returnDate: parsed.data.returnDate, returnedBy: actingUserId, updatedBy: actingUserId },
      tx
    );

    // If another member is waiting on this title, the copy goes on hold (RESERVED) for them
    // instead of back into general circulation — first-available-wins, oldest reservation first.
    const nextReservation = book ? await reservationRepository.findNextPendingForBook(tenantId, book.id, tx) : null;
    if (nextReservation) {
      await copyRepository.setStatus(tenantId, issue.bookCopyId, "RESERVED", tx);
      const notifiedAt = new Date();
      await reservationRepository.markAvailable(tenantId, nextReservation.id, notifiedAt, tx);
      await notifyLibraryMember(
        tenantId,
        nextReservation.memberType,
        nextReservation.memberId,
        {
          title: book ? `"${book.title}" is available` : "Reserved book is available",
          body: "Your reserved book is ready for pickup at the library.",
          referenceType: "BookReservation",
          referenceId: nextReservation.id,
        },
        tx
      );
    } else {
      await copyRepository.setStatus(tenantId, issue.bookCopyId, "AVAILABLE", tx);
    }

    await notifyLibraryMember(
      tenantId,
      issue.memberType,
      issue.memberId,
      {
        title: book ? `"${book.title}" returned` : "Book returned",
        body: "Thank you for returning the book.",
        referenceType: "BookIssue",
        referenceId: closed.id,
      },
      tx
    );

    return toDTO(closed);
  });
}

// Lost Book — closes the BookIssue (status=LOST) and flips the copy to LOST (permanently out of
// circulation until a librarian manually restores it, e.g. if the book is later found).
export async function markBookLost(issueId: string, input: unknown, context: LibraryContext): Promise<BookIssueDTO> {
  const parsed = markBookLostSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid lost-book data.");
  }
  const { tenantId, actingUserId } = context;

  const issueRepository = new PrismaBookIssueRepository();
  const issue = await issueRepository.findById(tenantId, issueId);
  if (!issue) throw new BookIssueNotFoundError();
  if (issue.status !== "ISSUED") throw new BookIssueNotOpenError();

  const copyRepository = new PrismaBookCopyRepository();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    const closed = await issueRepository.close(
      tenantId,
      issueId,
      { status: "LOST", returnDate: parsed.data.reportedDate, returnedBy: actingUserId, updatedBy: actingUserId },
      tx
    );
    await copyRepository.setStatus(tenantId, issue.bookCopyId, "LOST", tx);
    return toDTO(closed);
  });
}

// Damaged Book — closes the BookIssue (status=DAMAGED) and flips the copy to DAMAGED.
export async function markBookDamaged(issueId: string, input: unknown, context: LibraryContext): Promise<BookIssueDTO> {
  const parsed = markBookDamagedSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid damaged-book data.");
  }
  const { tenantId, actingUserId } = context;

  const issueRepository = new PrismaBookIssueRepository();
  const issue = await issueRepository.findById(tenantId, issueId);
  if (!issue) throw new BookIssueNotFoundError();
  if (issue.status !== "ISSUED") throw new BookIssueNotOpenError();

  const copyRepository = new PrismaBookCopyRepository();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    const closed = await issueRepository.close(
      tenantId,
      issueId,
      { status: "DAMAGED", returnDate: parsed.data.reportedDate, returnedBy: actingUserId, updatedBy: actingUserId },
      tx
    );
    await copyRepository.setStatus(tenantId, issue.bookCopyId, "DAMAGED", tx);
    return toDTO(closed);
  });
}

export { toDTO as toBookIssueDTO };
