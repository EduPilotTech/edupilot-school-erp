import type { Prisma } from "@/lib/generated/prisma/client";
import type { GradeBandEntity, GradeScaleEntity } from "./grade-scale.entity";

export interface CreateGradeScaleInput {
  tenantId: string;
  academicSessionId: string;
  name: string;
  createdBy?: string | null;
}

export interface CreateGradeBandInput {
  minPercentage: number;
  maxPercentage: number;
  grade: string;
  gradePoint?: number | null;
}

// Every method takes `tenantId` explicitly, per docs/CODING_STANDARDS.md §6.
export interface GradeScaleRepository {
  findById(tenantId: string, id: string): Promise<GradeScaleEntity | null>;
  findByName(tenantId: string, academicSessionId: string, name: string): Promise<GradeScaleEntity | null>;
  findByAcademicSession(tenantId: string, academicSessionId: string): Promise<GradeScaleEntity[]>;
  // `tx` optional (Sprint 4 — Step 4 pattern): set-grade-scale.service.ts creates the scale and
  // replaces its bands atomically, so this must be able to join that caller's transaction rather
  // than always opening its own.
  create(input: CreateGradeScaleInput, tx?: Prisma.TransactionClient): Promise<GradeScaleEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<GradeScaleEntity>;
}

// GradeBand has no stable natural key beyond its own range, so "set the full ordered list" is
// implemented as a full replace (delete existing, insert the new set) inside one transaction,
// not an upsert-by-natural-key like WorkingDay/PeriodConfiguration — see the schema's own
// comment on GradeBand for why a synthetic sequence field was deliberately not added.
export interface GradeBandRepository {
  findByGradeScale(tenantId: string, gradeScaleId: string): Promise<GradeBandEntity[]>;
  replaceAll(
    tenantId: string,
    gradeScaleId: string,
    bands: CreateGradeBandInput[],
    updatedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<GradeBandEntity[]>;
}
