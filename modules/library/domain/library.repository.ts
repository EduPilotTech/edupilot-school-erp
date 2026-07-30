import type { LibraryEntity } from "./library.entity";

export interface CreateLibraryInput {
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  address?: string | null;
  createdBy?: string | null;
}

export interface UpdateLibraryInput {
  name?: string;
  code?: string;
  address?: string | null;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface LibraryRepository {
  findById(tenantId: string, id: string): Promise<LibraryEntity | null>;
  findByCode(tenantId: string, code: string): Promise<LibraryEntity | null>;
  findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<LibraryEntity[]>;
  create(input: CreateLibraryInput): Promise<LibraryEntity>;
  update(tenantId: string, id: string, input: UpdateLibraryInput): Promise<LibraryEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<LibraryEntity>;
}
