import type { Prisma } from "@/lib/generated/prisma/client";
import type { FeeFrequencyValue, FeeStructureEntity, FeeStructureItemEntity } from "./fee-structure.entity";

export interface CreateFeeStructureInput {
  tenantId: string;
  academicSessionId: string;
  name: string;
  createdBy?: string | null;
}

export interface UpdateFeeStructureInput {
  name?: string;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface FeeStructureRepository {
  findById(tenantId: string, id: string): Promise<FeeStructureEntity | null>;
  findByName(tenantId: string, academicSessionId: string, name: string): Promise<FeeStructureEntity | null>;
  findByAcademicSession(tenantId: string, academicSessionId: string): Promise<FeeStructureEntity[]>;
  create(input: CreateFeeStructureInput): Promise<FeeStructureEntity>;
  update(tenantId: string, id: string, input: UpdateFeeStructureInput): Promise<FeeStructureEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<FeeStructureEntity>;
}

export interface CreateFeeStructureItemInput {
  tenantId: string;
  feeStructureId: string;
  classId: string;
  feeCategoryId: string;
  amount: number;
  frequency: FeeFrequencyValue;
  dueDayOfMonth?: number | null;
  createdBy?: string | null;
}

export interface UpdateFeeStructureItemInput {
  amount?: number;
  frequency?: FeeFrequencyValue;
  dueDayOfMonth?: number | null;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface FeeStructureItemRepository {
  findById(tenantId: string, id: string): Promise<FeeStructureItemEntity | null>;
  findByStructure(tenantId: string, feeStructureId: string): Promise<FeeStructureItemEntity[]>;
  findByStructureAndClass(
    tenantId: string,
    feeStructureId: string,
    classId: string
  ): Promise<FeeStructureItemEntity[]>;
  create(input: CreateFeeStructureItemInput, tx?: Prisma.TransactionClient): Promise<FeeStructureItemEntity>;
  update(
    tenantId: string,
    id: string,
    input: UpdateFeeStructureItemInput
  ): Promise<FeeStructureItemEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<FeeStructureItemEntity>;
}
