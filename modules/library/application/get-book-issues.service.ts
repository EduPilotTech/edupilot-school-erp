import "server-only";
import { PrismaBookIssueRepository } from "../infrastructure/prisma-book-issue.repository";
import { toBookIssueDTO } from "./book-circulation.service";
import type { BookIssueDTO } from "./dto/circulation.dto";
import type { BookIssueStatusValue, LibraryMemberTypeValue } from "../domain/book-issue.entity";

export async function getBookIssue(tenantId: string, issueId: string): Promise<BookIssueDTO | null> {
  const repository = new PrismaBookIssueRepository();
  const issue = await repository.findById(tenantId, issueId);
  return issue ? toBookIssueDTO(issue) : null;
}

export async function listBookIssuesByMember(
  tenantId: string,
  memberType: LibraryMemberTypeValue,
  memberId: string
): Promise<BookIssueDTO[]> {
  const repository = new PrismaBookIssueRepository();
  const issues = await repository.findByMember(tenantId, memberType, memberId);
  return issues.map(toBookIssueDTO);
}

export async function listOpenBookIssuesByMember(
  tenantId: string,
  memberType: LibraryMemberTypeValue,
  memberId: string
): Promise<BookIssueDTO[]> {
  const repository = new PrismaBookIssueRepository();
  const issues = await repository.findOpenByMember(tenantId, memberType, memberId);
  return issues.map(toBookIssueDTO);
}

export async function listBookIssuesByLibrary(
  tenantId: string,
  libraryId: string,
  filter?: { status?: BookIssueStatusValue }
): Promise<BookIssueDTO[]> {
  const repository = new PrismaBookIssueRepository();
  const issues = await repository.findByLibrary(tenantId, libraryId, filter);
  return issues.map(toBookIssueDTO);
}
