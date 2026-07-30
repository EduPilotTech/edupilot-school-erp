// Decision — `status` is maintained transactionally by the issue/return/renew/reserve/lost/
// damage services (never derived at read time), mirroring HostelBedEntity exactly.
export type BookCopyStatusValue = "AVAILABLE" | "ISSUED" | "RESERVED" | "LOST" | "DAMAGED";

// The physical, holdings-level unit — one row per copy of a Book. `accessionNumber` is the single
// canonical human-readable identifier; both the QR code and the Code128 barcode are rendered
// directly from it at UI/label render time — no redundant stored encoding of the same value.
export interface BookCopyEntity {
  id: string;
  tenantId: string;
  bookId: string;
  shelfId: string | null;
  accessionNumber: string;
  status: BookCopyStatusValue;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
