// Public catalog record — no tenantId (every tenant reads the same plan catalog; only platform
// staff write it). Mirrors BookEntity's plain-CRUD shape. `planCode` reuses the pre-existing
// SubscriptionPlan enum (already on Tenant, unused until this phase) — declared here as its own
// string-literal union rather than importing the Prisma-generated enum type, mirroring every
// other domain entity's "own string union, cast once in the repository's toEntity mapper"
// convention (see e.g. PayrollRunStatusValue).
export type SubscriptionPlanValue = "FREE" | "BASIC" | "PRO" | "ENTERPRISE";

export interface SubscriptionPlanDefinitionEntity {
  id: string;
  planCode: SubscriptionPlanValue;
  name: string;
  description: string | null;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  trialDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
