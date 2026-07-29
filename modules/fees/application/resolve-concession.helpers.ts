import type { FeeConcessionEntity } from "../domain/fee-concession.entity";

// Category-specific concession wins over the student's session-wide (feeCategoryId = null)
// concession — same "most specific match wins" rule as resolveFineRule. Only one concession
// applies per invoice (Phase 8 architecture review — stacking multiple concessions on the same
// charge is out of scope).
export function resolveConcession(
  concessions: FeeConcessionEntity[],
  feeCategoryId: string
): FeeConcessionEntity | null {
  const specific = concessions.find((concession) => concession.feeCategoryId === feeCategoryId);
  if (specific) return specific;
  return concessions.find((concession) => concession.feeCategoryId === null) ?? null;
}

export function computeDiscountAmount(amount: number, concession: FeeConcessionEntity | null): number {
  if (!concession) return 0;
  const discount =
    concession.valueType === "PERCENTAGE" ? (concession.value / 100) * amount : concession.value;
  return Math.round(Math.min(discount, amount) * 100) / 100;
}
