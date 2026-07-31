import type { Prisma } from "@/lib/generated/prisma/client";
import type { DepartmentEntity } from "./department.entity";

export interface CreateDepartmentInput {
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  createdBy?: string | null;
}

export interface UpdateDepartmentInput {
  name?: string;
  code?: string;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface DepartmentRepository {
  findById(tenantId: string, id: string): Promise<DepartmentEntity | null>;
  findByCode(tenantId: string, code: string): Promise<DepartmentEntity | null>;
  findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<DepartmentEntity[]>;
  create(input: CreateDepartmentInput, tx?: Prisma.TransactionClient): Promise<DepartmentEntity>;
  update(tenantId: string, id: string, input: UpdateDepartmentInput, tx?: Prisma.TransactionClient): Promise<DepartmentEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null, tx?: Prisma.TransactionClient): Promise<DepartmentEntity>;
}
