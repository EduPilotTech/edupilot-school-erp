import type { Prisma } from "@/lib/generated/prisma/client";
import type { BookIssueEntity, BookIssueStatusValue, LibraryMemberTypeValue } from "./book-issue.entity";

export interface CreateBookIssueInput {
  tenantId: string;
  bookCopyId: string;
  libraryId: string;
  memberType: LibraryMemberTypeValue;
  memberId: string;
  issueDate: Date;
  dueDate: Date;
  issuedBy?: string | null;
  createdBy?: string | null;
}

export interface RenewBookIssueUpdate {
  dueDate: Date;
  renewalCount: number;
  updatedBy?: string | null;
}

export interface CloseBookIssueUpdate {
  status: Extract<BookIssueStatusValue, "RETURNED" | "LOST" | "DAMAGED">;
  returnDate: Date;
  returnedBy?: string | null;
  updatedBy?: string | null;
}

export interface WaiveBookIssueFineUpdate {
  fineWaivedBy: string | null;
  fineWaivedReason: string;
  fineWaivedAt: Date;
}

export interface BookIssueRepository {
  findById(tenantId: string, id: string): Promise<BookIssueEntity | null>;
  // The still-open (status=ISSUED) row for a copy, if any.
  findOpenForCopy(tenantId: string, bookCopyId: string): Promise<BookIssueEntity | null>;
  findByMember(tenantId: string, memberType: LibraryMemberTypeValue, memberId: string): Promise<BookIssueEntity[]>;
  findOpenByMember(tenantId: string, memberType: LibraryMemberTypeValue, memberId: string): Promise<BookIssueEntity[]>;
  findByLibrary(
    tenantId: string,
    libraryId: string,
    filter?: { status?: BookIssueStatusValue }
  ): Promise<BookIssueEntity[]>;
  findOverdue(tenantId: string, libraryId: string, asOfDate: Date): Promise<BookIssueEntity[]>;
  create(input: CreateBookIssueInput, tx?: Prisma.TransactionClient): Promise<BookIssueEntity>;
  // The one allowed in-place mutation of an open row: extends its loan (never touches identity).
  renew(tenantId: string, id: string, update: RenewBookIssueUpdate): Promise<BookIssueEntity>;
  // Closes the row: RETURNED (normal return), LOST, or DAMAGED.
  close(tenantId: string, id: string, update: CloseBookIssueUpdate, tx?: Prisma.TransactionClient): Promise<BookIssueEntity>;
  waiveFine(tenantId: string, id: string, update: WaiveBookIssueFineUpdate): Promise<BookIssueEntity>;
}
