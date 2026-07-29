import type { FineRuleEntity, FineTypeValue } from "./fine-rule.entity";

export interface CreateFineRuleInput {
  tenantId: string;
  academicSessionId: string;
  feeCategoryId?: string | null;
  name: string;
  gracePeriodDays: number;
  fineType: FineTypeValue;
  fineValue: number;
  maxFineAmount?: number | null;
  createdBy?: string | null;
}

export interface UpdateFineRuleInput {
  name?: string;
  gracePeriodDays?: number;
  fineType?: FineTypeValue;
  fineValue?: number;
  maxFineAmount?: number | null;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface FineRuleRepository {
  findById(tenantId: string, id: string): Promise<FineRuleEntity | null>;
  findByAcademicSession(tenantId: string, academicSessionId: string): Promise<FineRuleEntity[]>;
  // The rule that applies to a given category: the category-specific rule if one exists,
  // otherwise the session's catch-all rule (feeCategoryId = null) — resolved by the caller
  // (compute-fine.helpers.ts), not by this method, which just returns every active rule for the
  // session.
  create(input: CreateFineRuleInput): Promise<FineRuleEntity>;
  update(tenantId: string, id: string, input: UpdateFineRuleInput): Promise<FineRuleEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<FineRuleEntity>;
}
