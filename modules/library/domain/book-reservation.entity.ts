import type { LibraryMemberTypeValue } from "./book-issue.entity";

export type BookReservationStatusValue = "PENDING" | "AVAILABLE" | "FULFILLED" | "CANCELLED" | "EXPIRED";

// A reservation is on the TITLE (Book), not a specific copy — the member is notified when ANY
// copy of the title becomes available. `fulfilledBookIssueId` is set once the reservation
// converts into an actual BookIssue.
export interface BookReservationEntity {
  id: string;
  tenantId: string;
  bookId: string;
  memberType: LibraryMemberTypeValue;
  memberId: string;
  reservationDate: Date;
  status: BookReservationStatusValue;
  notifiedAt: Date | null;
  fulfilledBookIssueId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
