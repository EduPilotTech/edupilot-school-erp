import type { FeeFrequencyValue } from "@/modules/fees/domain/fee-structure.entity";
import type { RouteFeeRuleEntity } from "./route-fee-rule.entity";

export interface CreateRouteFeeRuleInput {
  tenantId: string;
  routeId: string;
  academicSessionId: string;
  feeCategoryId: string;
  amount: number;
  frequency: FeeFrequencyValue;
  createdBy?: string | null;
}

export interface UpdateRouteFeeRuleInput {
  amount?: number;
  frequency?: FeeFrequencyValue;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface RouteFeeRuleRepository {
  findById(tenantId: string, id: string): Promise<RouteFeeRuleEntity | null>;
  findByRoute(tenantId: string, routeId: string, academicSessionId: string): Promise<RouteFeeRuleEntity[]>;
  findByAcademicSession(tenantId: string, academicSessionId: string): Promise<RouteFeeRuleEntity[]>;
  create(input: CreateRouteFeeRuleInput): Promise<RouteFeeRuleEntity>;
  update(tenantId: string, id: string, input: UpdateRouteFeeRuleInput): Promise<RouteFeeRuleEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<RouteFeeRuleEntity>;
}
