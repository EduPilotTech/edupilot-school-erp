import type { AuthorEntity } from "./author.entity";

export interface CreateAuthorInput {
  tenantId: string;
  schoolId: string;
  name: string;
  biography?: string | null;
  createdBy?: string | null;
}

export interface UpdateAuthorInput {
  name?: string;
  biography?: string | null;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface AuthorRepository {
  findById(tenantId: string, id: string): Promise<AuthorEntity | null>;
  findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<AuthorEntity[]>;
  create(input: CreateAuthorInput): Promise<AuthorEntity>;
  update(tenantId: string, id: string, input: UpdateAuthorInput): Promise<AuthorEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<AuthorEntity>;
}
