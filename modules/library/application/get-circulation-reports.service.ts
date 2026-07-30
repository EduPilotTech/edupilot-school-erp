import "server-only";
import { PrismaBookIssueRepository } from "../infrastructure/prisma-book-issue.repository";
import { PrismaBookCopyRepository } from "../infrastructure/prisma-book-copy.repository";
import { PrismaBookRepository } from "../infrastructure/prisma-book.repository";
import { resolveMemberDisplayName } from "./library-member.helpers";
import type { BookIssueEntity } from "../domain/book-issue.entity";
import type { CirculationRowDTO, OverdueRowDTO } from "./dto/reports.dto";

async function toRow(tenantId: string, issue: BookIssueEntity): Promise<CirculationRowDTO> {
  const copyRepository = new PrismaBookCopyRepository();
  const bookRepository = new PrismaBookRepository();
  const copy = await copyRepository.findById(tenantId, issue.bookCopyId);
  const book = copy ? await bookRepository.findById(tenantId, copy.bookId) : null;
  const memberName = await resolveMemberDisplayName(tenantId, issue.memberType, issue.memberId).catch(() => "Unknown");

  return {
    bookIssueId: issue.id,
    bookTitle: book?.title ?? "Unknown",
    accessionNumber: copy?.accessionNumber ?? "Unknown",
    memberType: issue.memberType,
    memberName,
    issueDate: issue.issueDate.toISOString().slice(0, 10),
    dueDate: issue.dueDate.toISOString().slice(0, 10),
    returnDate: issue.returnDate ? issue.returnDate.toISOString().slice(0, 10) : null,
    status: issue.status,
  };
}

// Issue Report — every book issued in a library, optionally within a date range.
export async function getIssueReport(
  tenantId: string,
  libraryId: string,
  range?: { from: Date; to: Date }
): Promise<CirculationRowDTO[]> {
  const repository = new PrismaBookIssueRepository();
  const issues = await repository.findByLibrary(tenantId, libraryId);
  const filtered = range ? issues.filter((i) => i.issueDate >= range.from && i.issueDate <= range.to) : issues;
  return Promise.all(filtered.map((issue) => toRow(tenantId, issue)));
}

// Return Report — every book returned in a library, optionally within a date range.
export async function getReturnReport(
  tenantId: string,
  libraryId: string,
  range?: { from: Date; to: Date }
): Promise<CirculationRowDTO[]> {
  const repository = new PrismaBookIssueRepository();
  const issues = await repository.findByLibrary(tenantId, libraryId, { status: "RETURNED" });
  const filtered = range ? issues.filter((i) => i.returnDate && i.returnDate >= range.from && i.returnDate <= range.to) : issues;
  return Promise.all(filtered.map((issue) => toRow(tenantId, issue)));
}

// Overdue Report — every still-open issue past its due date, as of now (lazily computed, never
// stored — mirrors FeeInvoice's own OVERDUE precedent).
export async function getOverdueReport(tenantId: string, libraryId: string, asOfDate: Date = new Date()): Promise<OverdueRowDTO[]> {
  const repository = new PrismaBookIssueRepository();
  const overdue = await repository.findOverdue(tenantId, libraryId, asOfDate);
  const msPerDay = 24 * 60 * 60 * 1000;

  const rows = await Promise.all(
    overdue.map(async (issue) => {
      const row = await toRow(tenantId, issue);
      const daysOverdue = Math.floor((asOfDate.getTime() - issue.dueDate.getTime()) / msPerDay);
      return { ...row, daysOverdue };
    })
  );
  return rows;
}

// Lost Books Report.
export async function getLostBooksReport(tenantId: string, libraryId: string): Promise<CirculationRowDTO[]> {
  const repository = new PrismaBookIssueRepository();
  const issues = await repository.findByLibrary(tenantId, libraryId, { status: "LOST" });
  return Promise.all(issues.map((issue) => toRow(tenantId, issue)));
}

// Damaged Books Report.
export async function getDamagedBooksReport(tenantId: string, libraryId: string): Promise<CirculationRowDTO[]> {
  const repository = new PrismaBookIssueRepository();
  const issues = await repository.findByLibrary(tenantId, libraryId, { status: "DAMAGED" });
  return Promise.all(issues.map((issue) => toRow(tenantId, issue)));
}
