import type { Prisma } from "@/lib/generated/prisma/client";
import type { BookReservationEntity, BookReservationStatusValue } from "./book-reservation.entity";
import type { LibraryMemberTypeValue } from "./book-issue.entity";

export interface CreateBookReservationInput {
  tenantId: string;
  bookId: string;
  memberType: LibraryMemberTypeValue;
  memberId: string;
  reservationDate: Date;
  createdBy?: string | null;
}

export interface BookReservationRepository {
  findById(tenantId: string, id: string): Promise<BookReservationEntity | null>;
  findByBook(
    tenantId: string,
    bookId: string,
    filter?: { status?: BookReservationStatusValue }
  ): Promise<BookReservationEntity[]>;
  // Oldest PENDING reservation for a book, if any — first-available-wins allocation order.
  findNextPendingForBook(tenantId: string, bookId: string, tx?: Prisma.TransactionClient): Promise<BookReservationEntity | null>;
  findByMember(tenantId: string, memberType: LibraryMemberTypeValue, memberId: string): Promise<BookReservationEntity[]>;
  findPendingByMemberAndBook(
    tenantId: string,
    memberType: LibraryMemberTypeValue,
    memberId: string,
    bookId: string
  ): Promise<BookReservationEntity | null>;
  create(input: CreateBookReservationInput): Promise<BookReservationEntity>;
  markAvailable(tenantId: string, id: string, notifiedAt: Date, tx?: Prisma.TransactionClient): Promise<BookReservationEntity>;
  fulfill(tenantId: string, id: string, fulfilledBookIssueId: string, tx?: Prisma.TransactionClient): Promise<BookReservationEntity>;
  cancel(tenantId: string, id: string, updatedBy: string | null): Promise<BookReservationEntity>;
  expire(tenantId: string, id: string, tx?: Prisma.TransactionClient): Promise<BookReservationEntity>;
}
