import type { Prisma } from "@/lib/generated/prisma/client";
import type { LeaveTypeEntity } from "./leave-type.entity";

export interface CreateLeaveTypeInput {
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  maxDaysPerYear: number;
  carryForwardAllowed?: boolean;
  carryForwardMaxDays?: number | null;
  createdBy?: string | null;
}

export interface UpdateLeaveTypeInput {
  name?: string;
  code?: string;
  maxDaysPerYear?: number;
  carryForwardAllowed?: boolean;
  carryForwardMaxDays?: number | null;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface LeaveTypeRepository {
  findById(tenantId: string, id: string): Promise<LeaveTypeEntity | null>;
  findByCode(tenantId: string, code: string): Promise<LeaveTypeEntity | null>;
  findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<LeaveTypeEntity[]>;
  create(input: CreateLeaveTypeInput, tx?: Prisma.TransactionClient): Promise<LeaveTypeEntity>;
  update(tenantId: string, id: string, input: UpdateLeaveTypeInput, tx?: Prisma.TransactionClient): Promise<LeaveTypeEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null, tx?: Prisma.TransactionClient): Promise<LeaveTypeEntity>;
}
