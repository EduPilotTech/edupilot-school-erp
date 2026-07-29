import type { FeeFrequencyValue } from "@/modules/fees/domain/fee-structure.entity";

// The transport analogue of FeeStructureItem — amount keyed by Route instead of Class (Decision
// 1). generateTransportInvoices reads this to create real FeeInvoice rows.
export interface RouteFeeRuleEntity {
  id: string;
  tenantId: string;
  routeId: string;
  academicSessionId: string;
  feeCategoryId: string;
  amount: number;
  frequency: FeeFrequencyValue;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
