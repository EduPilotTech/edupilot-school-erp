import type { BookEntity } from "./book.entity";

export interface CreateBookInput {
  tenantId: string;
  libraryId: string;
  bookCategoryId: string;
  authorId: string;
  publisherId: string;
  academicSubjectId?: string | null;
  title: string;
  isbn?: string | null;
  language: string;
  edition?: string | null;
  description?: string | null;
  replacementCost?: number;
  createdBy?: string | null;
}

export interface UpdateBookInput {
  bookCategoryId?: string;
  authorId?: string;
  publisherId?: string;
  academicSubjectId?: string | null;
  title?: string;
  isbn?: string | null;
  language?: string;
  edition?: string | null;
  description?: string | null;
  replacementCost?: number;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface BookFilter {
  isActive?: boolean;
  bookCategoryId?: string;
  authorId?: string;
  search?: string;
}

export interface BookRepository {
  findById(tenantId: string, id: string): Promise<BookEntity | null>;
  findByLibrary(tenantId: string, libraryId: string, filter?: BookFilter): Promise<BookEntity[]>;
  create(input: CreateBookInput): Promise<BookEntity>;
  update(tenantId: string, id: string, input: UpdateBookInput): Promise<BookEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<BookEntity>;
}
