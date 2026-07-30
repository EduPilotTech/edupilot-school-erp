import "server-only";
import { PrismaBookIssueRepository } from "@/modules/library/infrastructure/prisma-book-issue.repository";
import { PrismaBookCopyRepository } from "@/modules/library/infrastructure/prisma-book-copy.repository";
import { PrismaBookRepository } from "@/modules/library/infrastructure/prisma-book.repository";
import { PrismaBookReservationRepository } from "@/modules/library/infrastructure/prisma-book-reservation.repository";
import { PrismaFeeInvoiceRepository } from "@/modules/fees/infrastructure/prisma-fee-invoice.repository";
import { toFeeInvoiceDTO } from "@/modules/fees/application/fee-invoice.mapper";
import { resolveGuardianForUserProfile, assertGuardianCanAccessStudent } from "./guardian-access.helpers";
import type { MyLibraryDTO, MyLibraryIssueDTO } from "./dto/my-library.dto";
import type { BookIssueEntity } from "@/modules/library/domain/book-issue.entity";

export interface GetMyLibraryContext {
  tenantId: string;
  userProfileId: string;
}

// Parent Portal Integration (Phase 12 requirement 8) — issued books, history, due date, fine,
// overdue, and reservation status for one student, reusing the same guardian-access
// authorization gate every other parent-facing read service in this module uses.
export async function getMyLibrary(studentId: string, context: GetMyLibraryContext): Promise<MyLibraryDTO> {
  const guardian = await resolveGuardianForUserProfile(context.tenantId, context.userProfileId);
  await assertGuardianCanAccessStudent(context.tenantId, guardian.id, studentId);

  const issueRepository = new PrismaBookIssueRepository();
  const copyRepository = new PrismaBookCopyRepository();
  const bookRepository = new PrismaBookRepository();
  const today = new Date();

  async function toIssueDTO(issue: BookIssueEntity): Promise<MyLibraryIssueDTO> {
    const copy = await copyRepository.findById(context.tenantId, issue.bookCopyId);
    const book = copy ? await bookRepository.findById(context.tenantId, copy.bookId) : null;
    return {
      bookIssueId: issue.id,
      bookTitle: book?.title ?? "Unknown",
      issueDate: issue.issueDate.toISOString().slice(0, 10),
      dueDate: issue.dueDate.toISOString().slice(0, 10),
      returnDate: issue.returnDate ? issue.returnDate.toISOString().slice(0, 10) : null,
      status: issue.status,
      isOverdue: issue.status === "ISSUED" && issue.dueDate < today,
    };
  }

  const allIssues = await issueRepository.findByMember(context.tenantId, "STUDENT", studentId);
  const currentlyIssued = await Promise.all(allIssues.filter((i) => i.status === "ISSUED").map(toIssueDTO));
  const history = await Promise.all(allIssues.filter((i) => i.status !== "ISSUED").map(toIssueDTO));
  const overdueCount = currentlyIssued.filter((i) => i.isOverdue).length;

  const invoiceRepository = new PrismaFeeInvoiceRepository();
  const outstanding = await invoiceRepository.findOutstandingByStudent(context.tenantId, studentId);
  const totalFineDue = outstanding
    .filter((invoice) => invoice.bookIssueId !== null)
    .reduce((sum, invoice) => sum + toFeeInvoiceDTO(invoice).balance, 0);

  const reservationRepository = new PrismaBookReservationRepository();
  const reservationEntities = await reservationRepository.findByMember(context.tenantId, "STUDENT", studentId);
  const activeReservations = reservationEntities.filter((r) => r.status === "PENDING" || r.status === "AVAILABLE");
  const reservations = await Promise.all(
    activeReservations.map(async (reservation) => {
      const book = await bookRepository.findById(context.tenantId, reservation.bookId);
      return {
        reservationId: reservation.id,
        bookTitle: book?.title ?? "Unknown",
        status: reservation.status,
        reservationDate: reservation.reservationDate.toISOString().slice(0, 10),
      };
    })
  );

  return {
    currentlyIssued,
    history,
    overdueCount,
    totalFineDue: Math.round(totalFineDue * 100) / 100,
    reservations,
  };
}
