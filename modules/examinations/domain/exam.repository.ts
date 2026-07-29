import type { Prisma } from "@/lib/generated/prisma/client";
import type { ExamEntity, ExamStatusValue } from "./exam.entity";

export interface CreateExamInput {
  tenantId: string;
  academicSessionId: string;
  examTypeId: string;
  gradeScaleId?: string | null;
  name: string;
  startDate: Date;
  endDate: Date;
  createdBy?: string | null;
}

export interface UpdateExamInput {
  examTypeId?: string;
  gradeScaleId?: string | null;
  name?: string;
  startDate?: Date;
  endDate?: Date;
  status?: ExamStatusValue;
  updatedBy?: string | null;
}

// Every method takes `tenantId` explicitly, per docs/CODING_STANDARDS.md §6. No business rules
// here (e.g. which status transitions are legal) — that's exam-lifecycle.helpers.ts's job; this
// repository is a pure data reader/writer, per docs/CODING_STANDARDS.md §6's own rule.
export interface ExamRepository {
  findById(tenantId: string, id: string): Promise<ExamEntity | null>;
  findByAcademicSession(tenantId: string, academicSessionId: string): Promise<ExamEntity[]>;
  create(input: CreateExamInput): Promise<ExamEntity>;
  // `tx` optional (Sprint 4 — Step 4 pattern): bulk-generate-results.service.ts and
  // publish-results.service.ts move the exam's status forward as the last step of their own
  // larger transaction, so this must be able to join that caller's transaction.
  update(tenantId: string, id: string, input: UpdateExamInput, tx?: Prisma.TransactionClient): Promise<ExamEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<ExamEntity>;
}
