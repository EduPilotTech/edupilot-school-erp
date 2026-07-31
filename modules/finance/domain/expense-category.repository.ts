import type { ExpenseCategoryEntity } from "./expense-category.entity";

export interface CreateExpenseCategoryInput {
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  createdBy?: string | null;
}

export interface UpdateExpenseCategoryInput {
  name?: string;
  code?: string;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface ExpenseCategoryRepository {
  findById(tenantId: string, id: string): Promise<ExpenseCategoryEntity | null>;
  findByCode(tenantId: string, code: string): Promise<ExpenseCategoryEntity | null>;
  findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<ExpenseCategoryEntity[]>;
  create(input: CreateExpenseCategoryInput): Promise<ExpenseCategoryEntity>;
  update(tenantId: string, id: string, input: UpdateExpenseCategoryInput): Promise<ExpenseCategoryEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<ExpenseCategoryEntity>;
}
