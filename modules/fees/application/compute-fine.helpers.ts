import type { FineRuleEntity } from "../domain/fine-rule.entity";

export interface FineComputationInput {
  amount: number;
  dueDate: Date;
  asOfDate: Date;
}

// Selects the applicable FineRule for a fee category — a category-specific rule (feeCategoryId
// set) wins over the session's catch-all rule (feeCategoryId = null).
export function resolveFineRule(fineRules: FineRuleEntity[], feeCategoryId: string): FineRuleEntity | null {
  const specific = fineRules.find((rule) => rule.feeCategoryId === feeCategoryId);
  if (specific) return specific;
  return fineRules.find((rule) => rule.feeCategoryId === null) ?? null;
}

// Lazily computes the fine currently accrued on an invoice — the live-computation half of Phase 8
// Decision 4. Any still-PENDING/PARTIALLY_PAID invoice's displayed fine always comes from this
// function, never from the (deliberately stale-until-collection) FeeInvoice.fineAmount column.
export function computeFine(input: FineComputationInput, rule: FineRuleEntity | null): number {
  if (!rule) return 0;

  const msPerDay = 24 * 60 * 60 * 1000;
  const overdueDays = Math.floor((input.asOfDate.getTime() - input.dueDate.getTime()) / msPerDay);
  const daysPastGrace = overdueDays - rule.gracePeriodDays;
  if (daysPastGrace <= 0) return 0;

  let fine: number;
  switch (rule.fineType) {
    case "FLAT":
      fine = rule.fineValue;
      break;
    case "PERCENTAGE":
      fine = (rule.fineValue / 100) * input.amount;
      break;
    case "PER_DAY":
      fine = rule.fineValue * daysPastGrace;
      break;
  }

  if (rule.maxFineAmount != null) {
    fine = Math.min(fine, rule.maxFineAmount);
  }
  return Math.round(fine * 100) / 100;
}
