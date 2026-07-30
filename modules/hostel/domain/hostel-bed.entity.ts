// Decision — `status` is maintained transactionally by the assignment/transfer/check-out
// services (never derived at read time), directly serving the Vacant Beds report.
export type BedStatusValue = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "BLOCKED";

export interface HostelBedEntity {
  id: string;
  tenantId: string;
  roomId: string;
  bedNumber: string;
  status: BedStatusValue;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
