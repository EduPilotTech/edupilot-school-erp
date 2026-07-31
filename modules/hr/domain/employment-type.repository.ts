import type { Prisma } from "@/lib/generated/prisma/client";
import type { EmploymentTypeEntity } from "./employment-type.entity";

export interface CreateEmploymentTypeInput {
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  createdBy?: string | null;
}

export interface UpdateEmploymentTypeInput {
  name?: string;
  code?: string;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface EmploymentTypeRepository {
  findById(tenantId: string, id: string): Promise<EmploymentTypeEntity | null>;
  findByCode(tenantId: string, code: string): Promise<EmploymentTypeEntity | null>;
  findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<EmploymentTypeEntity[]>;
  create(input: CreateEmploymentTypeInput, tx?: Prisma.TransactionClient): Promise<EmploymentTypeEntity>;
  update(tenantId: string, id: string, input: UpdateEmploymentTypeInput, tx?: Prisma.TransactionClient): Promise<EmploymentTypeEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null, tx?: Prisma.TransactionClient): Promise<EmploymentTypeEntity>;
}
