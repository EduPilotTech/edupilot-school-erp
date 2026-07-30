import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { BookIssue as PrismaBookIssue, Prisma } from "@/lib/generated/prisma/client";
import type {
  BookIssueRepository,
  CloseBookIssueUpdate,
  CreateBookIssueInput,
  RenewBookIssueUpdate,
  WaiveBookIssueFineUpdate,
} from "../domain/book-issue.repository";
import type { BookIssueEntity, BookIssueStatusValue, LibraryMemberTypeValue } from "../domain/book-issue.entity";

function toEntity(row: PrismaBookIssue): BookIssueEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    bookCopyId: row.bookCopyId,
    libraryId: row.libraryId,
    memberType: row.memberType,
    memberId: row.memberId,
    issueDate: row.issueDate,
    dueDate: row.dueDate,
    returnDate: row.returnDate,
    status: row.status,
    renewalCount: row.renewalCount,
    issuedBy: row.issuedBy,
    returnedBy: row.returnedBy,
    fineWaived: row.fineWaived,
    fineWaivedBy: row.fineWaivedBy,
    fineWaivedReason: row.fineWaivedReason,
    fineWaivedAt: row.fineWaivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaBookIssueRepository implements BookIssueRepository {
  async findById(tenantId: string, id: string): Promise<BookIssueEntity | null> {
    const row = await withTenantContext(tenantId, (tx) => tx.bookIssue.findUnique({ where: { tenantId_id: { tenantId, id } } }));
    return row ? toEntity(row) : null;
  }

  async findOpenForCopy(tenantId: string, bookCopyId: string): Promise<BookIssueEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.bookIssue.findFirst({ where: { tenantId, bookCopyId, status: "ISSUED" } })
    );
    return row ? toEntity(row) : null;
  }

  async findByMember(tenantId: string, memberType: LibraryMemberTypeValue, memberId: string): Promise<BookIssueEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.bookIssue.findMany({ where: { tenantId, memberType, memberId }, orderBy: { issueDate: "desc" } })
    );
    return rows.map(toEntity);
  }

  async findOpenByMember(tenantId: string, memberType: LibraryMemberTypeValue, memberId: string): Promise<BookIssueEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.bookIssue.findMany({ where: { tenantId, memberType, memberId, status: "ISSUED" }, orderBy: { dueDate: "asc" } })
    );
    return rows.map(toEntity);
  }

  async findByLibrary(
    tenantId: string,
    libraryId: string,
    filter?: { status?: BookIssueStatusValue }
  ): Promise<BookIssueEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.bookIssue.findMany({ where: { tenantId, libraryId, status: filter?.status }, orderBy: { issueDate: "desc" } })
    );
    return rows.map(toEntity);
  }

  async findOverdue(tenantId: string, libraryId: string, asOfDate: Date): Promise<BookIssueEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.bookIssue.findMany({
        where: { tenantId, libraryId, status: "ISSUED", dueDate: { lt: asOfDate } },
        orderBy: { dueDate: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateBookIssueInput, tx?: Prisma.TransactionClient): Promise<BookIssueEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.bookIssue.create({
          data: {
            tenantId: input.tenantId,
            bookCopyId: input.bookCopyId,
            libraryId: input.libraryId,
            memberType: input.memberType,
            memberId: input.memberId,
            issueDate: input.issueDate,
            dueDate: input.dueDate,
            issuedBy: input.issuedBy ?? null,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async renew(tenantId: string, id: string, update: RenewBookIssueUpdate): Promise<BookIssueEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.bookIssue.update({
        where: { tenantId_id: { tenantId, id } },
        data: { dueDate: update.dueDate, renewalCount: update.renewalCount, updatedBy: update.updatedBy ?? null },
      })
    );
    return toEntity(row);
  }

  async close(tenantId: string, id: string, update: CloseBookIssueUpdate, tx?: Prisma.TransactionClient): Promise<BookIssueEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.bookIssue.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            status: update.status,
            returnDate: update.returnDate,
            returnedBy: update.returnedBy ?? null,
            updatedBy: update.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async waiveFine(tenantId: string, id: string, update: WaiveBookIssueFineUpdate): Promise<BookIssueEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.bookIssue.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          fineWaived: true,
          fineWaivedBy: update.fineWaivedBy,
          fineWaivedReason: update.fineWaivedReason,
          fineWaivedAt: update.fineWaivedAt,
        },
      })
    );
    return toEntity(row);
  }
}
