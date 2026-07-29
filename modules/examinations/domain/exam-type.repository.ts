import type { ExamTypeEntity } from "./exam-type.entity";

export interface CreateExamTypeInput {
  tenantId: string;
  name: string;
  code: string;
  createdBy?: string | null;
}

export interface UpdateExamTypeInput {
  name?: string;
  code?: string;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface ExamTypeListFilter {
  page: number;
  pageSize: number;
}

export interface ExamTypeListResult {
  items: ExamTypeEntity[];
  total: number;
  page: number;
  pageSize: number;
}

// Every method takes `tenantId` explicitly, per docs/CODING_STANDARDS.md §6 — no ambient tenant
// context, never trusted from a caller's request.
export interface ExamTypeRepository {
  findById(tenantId: string, id: string): Promise<ExamTypeEntity | null>;
  findByCode(tenantId: string, code: string): Promise<ExamTypeEntity | null>;
  findMany(tenantId: string, filter: ExamTypeListFilter): Promise<ExamTypeListResult>;
  create(input: CreateExamTypeInput): Promise<ExamTypeEntity>;
  update(tenantId: string, id: string, input: UpdateExamTypeInput): Promise<ExamTypeEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<ExamTypeEntity>;
  restore(tenantId: string, id: string, updatedBy: string | null): Promise<ExamTypeEntity>;
}
