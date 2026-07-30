import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { PrismaBookRepository } from "../infrastructure/prisma-book.repository";
import { PrismaBookCopyRepository } from "../infrastructure/prisma-book-copy.repository";
import { PrismaBookIssueRepository } from "../infrastructure/prisma-book-issue.repository";
import { PrismaBookReservationRepository } from "../infrastructure/prisma-book-reservation.repository";
import {
  BookNotFoundError,
  BookReservationNotFoundError,
  BookReservationNotPendingError,
  DuplicateReservationError,
} from "../domain/errors";
import { assertMemberExists } from "./library-member.helpers";
import { getLibrarySettings } from "./library-settings.service";
import { reserveBookSchema, type BookReservationDTO } from "./dto/reservation.dto";
import type { BookReservationEntity } from "../domain/book-reservation.entity";
import type { LibraryMemberTypeValue } from "../domain/book-issue.entity";
import type { LibraryContext } from "./library.service";

function toDTO(entity: BookReservationEntity): BookReservationDTO {
  return {
    id: entity.id,
    bookId: entity.bookId,
    memberType: entity.memberType,
    memberId: entity.memberId,
    reservationDate: entity.reservationDate.toISOString().slice(0, 10),
    status: entity.status,
    notifiedAt: entity.notifiedAt ? entity.notifiedAt.toISOString() : null,
    fulfilledBookIssueId: entity.fulfilledBookIssueId,
  };
}

// A reservation is on the title, not a specific copy — created as PENDING regardless of current
// availability, mirroring a real hold-queue. It only advances to AVAILABLE when a copy of this
// title is actually returned (see returnBook's own reservation check).
export async function reserveBook(input: unknown, context: LibraryContext): Promise<BookReservationDTO> {
  const parsed = reserveBookSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid reservation data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const bookRepository = new PrismaBookRepository();
  const book = await bookRepository.findById(tenantId, data.bookId);
  if (!book || book.deletedAt !== null) throw new BookNotFoundError();

  await assertMemberExists(tenantId, data.memberType, data.memberId);

  const repository = new PrismaBookReservationRepository();
  const existing = await repository.findPendingByMemberAndBook(tenantId, data.memberType, data.memberId, data.bookId);
  if (existing) throw new DuplicateReservationError();

  const reservation = await repository.create({
    tenantId,
    bookId: data.bookId,
    memberType: data.memberType,
    memberId: data.memberId,
    reservationDate: data.reservationDate,
    createdBy: actingUserId,
  });
  return toDTO(reservation);
}

export async function cancelReservation(reservationId: string, context: LibraryContext): Promise<BookReservationDTO> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaBookReservationRepository();
  const existing = await repository.findById(tenantId, reservationId);
  if (!existing) throw new BookReservationNotFoundError();
  if (existing.status !== "PENDING" && existing.status !== "AVAILABLE") {
    throw new BookReservationNotPendingError();
  }

  if (existing.status === "AVAILABLE") {
    // The copy was placed on hold for this reservation — release it back to general circulation.
    const copyRepository = new PrismaBookCopyRepository();
    const copies = await copyRepository.findByBook(tenantId, existing.bookId);
    const heldCopy = copies.find((copy) => copy.status === "RESERVED");
    if (heldCopy) {
      await copyRepository.setStatus(tenantId, heldCopy.id, "AVAILABLE");
    }
  }

  const cancelled = await repository.cancel(tenantId, reservationId, actingUserId);
  return toDTO(cancelled);
}

// Converts a held (status=AVAILABLE) reservation into an actual BookIssue — the member has come
// to collect their reserved book.
export async function fulfillReservation(reservationId: string, context: LibraryContext): Promise<BookReservationDTO> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaBookReservationRepository();
  const reservation = await repository.findById(tenantId, reservationId);
  if (!reservation) throw new BookReservationNotFoundError();
  if (reservation.status !== "AVAILABLE") throw new BookReservationNotPendingError("This reservation is not on hold yet.");

  const copyRepository = new PrismaBookCopyRepository();
  const copies = await copyRepository.findByBook(tenantId, reservation.bookId);
  const heldCopy = copies.find((copy) => copy.status === "RESERVED");
  if (!heldCopy) throw new BookReservationNotPendingError("No held copy found for this reservation.");

  const bookRepository = new PrismaBookRepository();
  const book = await bookRepository.findById(tenantId, reservation.bookId);
  if (!book) throw new BookNotFoundError();

  const issueRepository = new PrismaBookIssueRepository();
  const settings = await getLibrarySettings(tenantId, book.libraryId);
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + settings.defaultLoanPeriodDays);

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const issue = await issueRepository.create(
      {
        tenantId,
        bookCopyId: heldCopy.id,
        libraryId: book.libraryId,
        memberType: reservation.memberType,
        memberId: reservation.memberId,
        issueDate: today,
        dueDate,
        issuedBy: actingUserId,
        createdBy: actingUserId,
      },
      tx
    );
    await copyRepository.setStatus(tenantId, heldCopy.id, "ISSUED", tx);
    const fulfilled = await repository.fulfill(tenantId, reservationId, issue.id, tx);
    return toDTO(fulfilled);
  });
}

export async function listReservationsByBook(
  tenantId: string,
  bookId: string,
  filter?: { status?: BookReservationDTO["status"] }
): Promise<BookReservationDTO[]> {
  const repository = new PrismaBookReservationRepository();
  const reservations = await repository.findByBook(tenantId, bookId, filter);
  return reservations.map(toDTO);
}

export async function listReservationsByMember(
  tenantId: string,
  memberType: LibraryMemberTypeValue,
  memberId: string
): Promise<BookReservationDTO[]> {
  const repository = new PrismaBookReservationRepository();
  const reservations = await repository.findByMember(tenantId, memberType, memberId);
  return reservations.map(toDTO);
}

export { toDTO as toBookReservationDTO };
