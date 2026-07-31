import type { Prisma } from "@/lib/generated/prisma/client";
import type { DesignationEntity } from "./designation.entity";

export interface CreateDesignationInput {
  tenantId: string;
  schoolId: string;
  departmentId?: string | null;
  name: string;
  code: string;
  createdBy?: string | null;
}

export interface UpdateDesignationInput {
  departmentId?: string | null;
  name?: string;
  code?: string;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface DesignationRepository {
  findById(tenantId: string, id: string): Promise<DesignationEntity | null>;
  findByCode(tenantId: string, code: string): Promise<DesignationEntity | null>;
  findMany(tenantId: string, filter?: { isActive?: boolean; departmentId?: string }): Promise<DesignationEntity[]>;
  create(input: CreateDesignationInput, tx?: Prisma.TransactionClient): Promise<DesignationEntity>;
  update(tenantId: string, id: string, input: UpdateDesignationInput, tx?: Prisma.TransactionClient): Promise<DesignationEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null, tx?: Prisma.TransactionClient): Promise<DesignationEntity>;
}
