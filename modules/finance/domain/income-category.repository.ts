import type { IncomeCategoryEntity } from "./income-category.entity";

export interface CreateIncomeCategoryInput {
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  createdBy?: string | null;
}

export interface UpdateIncomeCategoryInput {
  name?: string;
  code?: string;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface IncomeCategoryRepository {
  findById(tenantId: string, id: string): Promise<IncomeCategoryEntity | null>;
  findByCode(tenantId: string, code: string): Promise<IncomeCategoryEntity | null>;
  findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<IncomeCategoryEntity[]>;
  create(input: CreateIncomeCategoryInput): Promise<IncomeCategoryEntity>;
  update(tenantId: string, id: string, input: UpdateIncomeCategoryInput): Promise<IncomeCategoryEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<IncomeCategoryEntity>;
}
