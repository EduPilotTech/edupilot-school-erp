import type { BookCategoryEntity } from "./book-category.entity";

export interface CreateBookCategoryInput {
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  createdBy?: string | null;
}

export interface UpdateBookCategoryInput {
  name?: string;
  code?: string;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface BookCategoryRepository {
  findById(tenantId: string, id: string): Promise<BookCategoryEntity | null>;
  findByCode(tenantId: string, code: string): Promise<BookCategoryEntity | null>;
  findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<BookCategoryEntity[]>;
  create(input: CreateBookCategoryInput): Promise<BookCategoryEntity>;
  update(tenantId: string, id: string, input: UpdateBookCategoryInput): Promise<BookCategoryEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<BookCategoryEntity>;
}
