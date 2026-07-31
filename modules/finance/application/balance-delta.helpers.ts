// Pure — no "server-only", no Prisma import — so the one piece of real business logic in this
// module (how recordIncome/updateIncome/deleteIncome and their Expense equivalents move
// FinanceAccount.currentBalance) can be unit-tested directly, mirroring
// modules/payroll/application/salary-calculation.helpers.ts's own "pure logic kept separate from
// server-only files" pattern. This codebase has no existing precedent for mocking Prisma inside a
// `*.service.test.ts` (no `vi.mock` usage against a Prisma repository anywhere in the repo), so —
// per that same Payroll precedent — the arithmetic is extracted here instead of invented as a new
// mocking pattern.

// Income entries increase a FinanceAccount's balance; Expense entries decrease it. Every function
// below is written once in terms of this direction so the exact same math backs both ledgers.
export type EntryDirection = 1 | -1;
export const INCOME_DIRECTION: EntryDirection = 1;
export const EXPENSE_DIRECTION: EntryDirection = -1;

export interface BalanceDeltaLine {
  accountId: string;
  delta: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Recording a brand-new entry: the full amount moves onto one account, in the entry type's own
// direction (positive for Income, negative for Expense). Returns no line at all for a zero
// amount, so callers never issue a no-op `adjustBalance` write.
export function computeRecordDelta(direction: EntryDirection, amount: number, accountId: string): BalanceDeltaLine[] {
  const delta = round2(direction * amount);
  return delta === 0 ? [] : [{ accountId, delta }];
}

// Soft-deleting an entry: the exact inverse of computeRecordDelta — undoes what recording it
// originally applied.
export function computeDeleteDelta(direction: EntryDirection, amount: number, accountId: string): BalanceDeltaLine[] {
  return computeRecordDelta(direction, -amount, accountId);
}

// Editing an entry whose `amount` and/or `financeAccountId` may have changed: reverse the OLD
// amount's effect on the OLD account, then apply the NEW amount's effect on the NEW account. When
// the account didn't change, these net into a single delta on that one account (so an edit that
// only tweaks the amount issues exactly one `adjustBalance` call, not two that briefly pass
// through an intermediate wrong balance). When the account DID change, two separate lines are
// returned — one reversal on the old account, one application on the new account — omitting
// either line if its own delta happens to be zero.
export function computeUpdateDelta(
  direction: EntryDirection,
  oldAmount: number,
  oldAccountId: string,
  newAmount: number,
  newAccountId: string
): BalanceDeltaLine[] {
  const reversal = round2(-direction * oldAmount);
  const application = round2(direction * newAmount);

  if (oldAccountId === newAccountId) {
    const net = round2(reversal + application);
    return net === 0 ? [] : [{ accountId: newAccountId, delta: net }];
  }

  const lines: BalanceDeltaLine[] = [];
  if (reversal !== 0) lines.push({ accountId: oldAccountId, delta: reversal });
  if (application !== 0) lines.push({ accountId: newAccountId, delta: application });
  return lines;
}
