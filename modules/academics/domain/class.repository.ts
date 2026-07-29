import type { ClassEntity } from "./class.entity";

export interface CreateClassInput {
  tenantId: string;
  schoolId: string;
  academicSessionId: string;
  name: string;
  grade?: number | null;
  createdBy?: string | null;
}

export interface UpdateClassInput {
  name?: string;
  grade?: number | null;
  updatedBy?: string | null;
}

export interface ClassListFilter {
  academicSessionId?: string;
  page: number;
  pageSize: number;
}

export interface ClassListResult {
  items: ClassEntity[];
  total: number;
  page: number;
  pageSize: number;
}

// Every method takes `tenantId` explicitly, per docs/CODING_STANDARDS.md §6 — no ambient tenant
// context, never trusted from a caller's request.
export interface ClassRepository {
  findById(tenantId: string, id: string): Promise<ClassEntity | null>;
  findMany(tenantId: string, filter: ClassListFilter): Promise<ClassListResult>;
  create(input: CreateClassInput): Promise<ClassEntity>;
  update(tenantId: string, id: string, input: UpdateClassInput): Promise<ClassEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<ClassEntity>;
  restore(tenantId: string, id: string, updatedBy: string | null): Promise<ClassEntity>;
}
