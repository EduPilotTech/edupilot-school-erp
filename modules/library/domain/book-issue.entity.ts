export type LibraryMemberTypeValue = "STUDENT" | "TEACHER" | "STAFF";
export type BookIssueStatusValue = "ISSUED" | "RETURNED" | "LOST" | "DAMAGED";

// One row per loan episode — APPEND-ONLY. A return closes the row (status + returnDate); it is
// never edited into a new "issue." Renewal extends `dueDate`/`renewalCount` in place on the same
// still-open row — a renewal doesn't change the loan's identity, only its length, unlike a hostel
// Transfer which does change room/bed identity. This history is itself the audit trail for
// custody — no separate LibraryAuditLog.
//
// `memberType`/`memberId` is the polymorphic member reference (mirrors
// FeeLedgerEntry.referenceType/referenceId) — validated against Student/Teacher/UserProfile by
// the application layer, never a DB-level FK, since there is no generic Staff table to reuse.
export interface BookIssueEntity {
  id: string;
  tenantId: string;
  bookCopyId: string;
  libraryId: string;
  memberType: LibraryMemberTypeValue;
  memberId: string;
  issueDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  status: BookIssueStatusValue;
  renewalCount: number;
  issuedBy: string | null;
  returnedBy: string | null;
  fineWaived: boolean;
  fineWaivedBy: string | null;
  fineWaivedReason: string | null;
  fineWaivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
