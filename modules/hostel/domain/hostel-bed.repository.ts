import type { Prisma } from "@/lib/generated/prisma/client";
import type { BedStatusValue, HostelBedEntity } from "./hostel-bed.entity";

export interface CreateHostelBedInput {
  tenantId: string;
  roomId: string;
  bedNumber: string;
  createdBy?: string | null;
}

export interface UpdateHostelBedInput {
  bedNumber?: string;
  updatedBy?: string | null;
}

export interface HostelBedRepository {
  findById(tenantId: string, id: string): Promise<HostelBedEntity | null>;
  findByRoom(tenantId: string, roomId: string): Promise<HostelBedEntity[]>;
  findVacantByRoom(tenantId: string, roomId: string): Promise<HostelBedEntity[]>;
  create(input: CreateHostelBedInput): Promise<HostelBedEntity>;
  update(tenantId: string, id: string, input: UpdateHostelBedInput): Promise<HostelBedEntity>;
  // Transactionally maintained by the assignment/transfer/check-out services — see
  // HostelBedEntity's own doc comment for why this is a persisted status, not a derived one.
  setStatus(tenantId: string, id: string, status: BedStatusValue, tx?: Prisma.TransactionClient): Promise<HostelBedEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HostelBedEntity>;
}
