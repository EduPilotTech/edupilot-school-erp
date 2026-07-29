import type { SubjectEntity } from "./subject.entity";

export interface CreateSubjectInput {
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  createdBy?: string | null;
}

export interface UpdateSubjectInput {
  name?: string;
  code?: string;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface SubjectListFilter {
  page: number;
  pageSize: number;
}

export interface SubjectListResult {
  items: SubjectEntity[];
  total: number;
  page: number;
  pageSize: number;
}

// Every method takes `tenantId` explicitly, per docs/CODING_STANDARDS.md §6 — no ambient tenant
// context, never trusted from a caller's request.
export interface SubjectRepository {
  findById(tenantId: string, id: string): Promise<SubjectEntity | null>;
  findByCode(tenantId: string, code: string): Promise<SubjectEntity | null>;
  findMany(tenantId: string, filter: SubjectListFilter): Promise<SubjectListResult>;
  create(input: CreateSubjectInput): Promise<SubjectEntity>;
  update(tenantId: string, id: string, input: UpdateSubjectInput): Promise<SubjectEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<SubjectEntity>;
  restore(tenantId: string, id: string, updatedBy: string | null): Promise<SubjectEntity>;
}
