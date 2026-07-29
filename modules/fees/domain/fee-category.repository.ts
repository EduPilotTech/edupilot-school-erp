import type { FeeCategoryEntity } from "./fee-category.entity";

export interface CreateFeeCategoryInput {
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  isRecurring: boolean;
  hsnSacCode?: string | null;
  taxRatePercent?: number | null;
  createdBy?: string | null;
}

export interface UpdateFeeCategoryInput {
  name?: string;
  code?: string;
  isRecurring?: boolean;
  hsnSacCode?: string | null;
  taxRatePercent?: number | null;
  isActive?: boolean;
  updatedBy?: string | null;
}

// Every method takes `tenantId` explicitly, per docs/CODING_STANDARDS.md §6 — no ambient tenant
// context, mirrors modules/academics/domain/subject.repository.ts exactly (FeeCategory is the
// same shape of tenant-wide master data as Subject).
export interface FeeCategoryRepository {
  findById(tenantId: string, id: string): Promise<FeeCategoryEntity | null>;
  findByCode(tenantId: string, code: string): Promise<FeeCategoryEntity | null>;
  findMany(tenantId: string): Promise<FeeCategoryEntity[]>;
  create(input: CreateFeeCategoryInput): Promise<FeeCategoryEntity>;
  update(tenantId: string, id: string, input: UpdateFeeCategoryInput): Promise<FeeCategoryEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<FeeCategoryEntity>;
}
