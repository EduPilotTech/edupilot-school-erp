import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { BookReservation as PrismaBookReservation, Prisma } from "@/lib/generated/prisma/client";
import type { BookReservationRepository, CreateBookReservationInput } from "../domain/book-reservation.repository";
import type { BookReservationEntity, BookReservationStatusValue } from "../domain/book-reservation.entity";
import type { LibraryMemberTypeValue } from "../domain/book-issue.entity";

function toEntity(row: PrismaBookReservation): BookReservationEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    bookId: row.bookId,
    memberType: row.memberType,
    memberId: row.memberId,
    reservationDate: row.reservationDate,
    status: row.status,
    notifiedAt: row.notifiedAt,
    fulfilledBookIssueId: row.fulfilledBookIssueId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaBookReservationRepository implements BookReservationRepository {
  async findById(tenantId: string, id: string): Promise<BookReservationEntity | null> {
    const row = await withTenantContext(tenantId, (tx) => tx.bookReservation.findUnique({ where: { tenantId_id: { tenantId, id } } }));
    return row ? toEntity(row) : null;
  }

  async findByBook(
    tenantId: string,
    bookId: string,
    filter?: { status?: BookReservationStatusValue }
  ): Promise<BookReservationEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.bookReservation.findMany({ where: { tenantId, bookId, status: filter?.status }, orderBy: { reservationDate: "asc" } })
    );
    return rows.map(toEntity);
  }

  async findNextPendingForBook(tenantId: string, bookId: string, tx?: Prisma.TransactionClient): Promise<BookReservationEntity | null> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.bookReservation.findFirst({
          where: { tenantId, bookId, status: "PENDING" },
          orderBy: { reservationDate: "asc" },
        }),
      tx
    );
    return row ? toEntity(row) : null;
  }

  async findByMember(tenantId: string, memberType: LibraryMemberTypeValue, memberId: string): Promise<BookReservationEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.bookReservation.findMany({ where: { tenantId, memberType, memberId }, orderBy: { reservationDate: "desc" } })
    );
    return rows.map(toEntity);
  }

  async findPendingByMemberAndBook(
    tenantId: string,
    memberType: LibraryMemberTypeValue,
    memberId: string,
    bookId: string
  ): Promise<BookReservationEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.bookReservation.findFirst({ where: { tenantId, memberType, memberId, bookId, status: "PENDING" } })
    );
    return row ? toEntity(row) : null;
  }

  async create(input: CreateBookReservationInput): Promise<BookReservationEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.bookReservation.create({
        data: {
          tenantId: input.tenantId,
          bookId: input.bookId,
          memberType: input.memberType,
          memberId: input.memberId,
          reservationDate: input.reservationDate,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async markAvailable(tenantId: string, id: string, notifiedAt: Date, tx?: Prisma.TransactionClient): Promise<BookReservationEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.bookReservation.update({ where: { tenantId_id: { tenantId, id } }, data: { status: "AVAILABLE", notifiedAt } }),
      tx
    );
    return toEntity(row);
  }

  async fulfill(tenantId: string, id: string, fulfilledBookIssueId: string, tx?: Prisma.TransactionClient): Promise<BookReservationEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.bookReservation.update({
          where: { tenantId_id: { tenantId, id } },
          data: { status: "FULFILLED", fulfilledBookIssueId },
        }),
      tx
    );
    return toEntity(row);
  }

  async cancel(tenantId: string, id: string, updatedBy: string | null): Promise<BookReservationEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.bookReservation.update({ where: { tenantId_id: { tenantId, id } }, data: { status: "CANCELLED", updatedBy } })
    );
    return toEntity(row);
  }

  async expire(tenantId: string, id: string, tx?: Prisma.TransactionClient): Promise<BookReservationEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) => client.bookReservation.update({ where: { tenantId_id: { tenantId, id } }, data: { status: "EXPIRED" } }),
      tx
    );
    return toEntity(row);
  }
}
