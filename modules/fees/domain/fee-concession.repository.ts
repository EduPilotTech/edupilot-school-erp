import type { FeeConcessionEntity, FeeConcessionTypeValue, FeeConcessionValueTypeValue } from "./fee-concession.entity";

export interface CreateFeeConcessionInput {
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  feeCategoryId?: string | null;
  type: FeeConcessionTypeValue;
  valueType: FeeConcessionValueTypeValue;
  value: number;
  reason?: string | null;
  createdBy?: string | null;
}

export interface FeeConcessionRepository {
  findById(tenantId: string, id: string): Promise<FeeConcessionEntity | null>;
  // Every active concession for a student this session — invoice generation filters this down to
  // the most specific match (category-specific beats session-wide) itself; see
  // resolve-concession.helpers.ts.
  findByStudent(tenantId: string, studentId: string, academicSessionId: string): Promise<FeeConcessionEntity[]>;
  create(input: CreateFeeConcessionInput): Promise<FeeConcessionEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<FeeConcessionEntity>;
}
