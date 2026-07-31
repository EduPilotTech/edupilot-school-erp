import { describe, expect, it } from "vitest";
import {
  computeDeleteDelta,
  computeRecordDelta,
  computeUpdateDelta,
  EXPENSE_DIRECTION,
  INCOME_DIRECTION,
} from "./balance-delta.helpers";

const ACCOUNT_A = "11111111-1111-4111-8111-111111111111";
const ACCOUNT_B = "22222222-2222-4222-8222-222222222222";

describe("computeRecordDelta", () => {
  it("credits the full amount to the account for an Income entry", () => {
    expect(computeRecordDelta(INCOME_DIRECTION, 5000, ACCOUNT_A)).toEqual([{ accountId: ACCOUNT_A, delta: 5000 }]);
  });

  it("debits the full amount from the account for an Expense entry", () => {
    expect(computeRecordDelta(EXPENSE_DIRECTION, 1200, ACCOUNT_A)).toEqual([{ accountId: ACCOUNT_A, delta: -1200 }]);
  });

  it("produces no line for a zero amount", () => {
    expect(computeRecordDelta(INCOME_DIRECTION, 0, ACCOUNT_A)).toEqual([]);
  });

  it("rounds to 2 decimal places", () => {
    expect(computeRecordDelta(INCOME_DIRECTION, 100.005, ACCOUNT_A)).toEqual([{ accountId: ACCOUNT_A, delta: 100.01 }]);
  });
});

describe("computeDeleteDelta", () => {
  it("reverses a previously recorded Income (debits the account)", () => {
    expect(computeDeleteDelta(INCOME_DIRECTION, 5000, ACCOUNT_A)).toEqual([{ accountId: ACCOUNT_A, delta: -5000 }]);
  });

  it("reverses a previously recorded Expense (credits the account)", () => {
    expect(computeDeleteDelta(EXPENSE_DIRECTION, 1200, ACCOUNT_A)).toEqual([{ accountId: ACCOUNT_A, delta: 1200 }]);
  });

  it("exactly undoes computeRecordDelta for the same amount", () => {
    const recorded = computeRecordDelta(INCOME_DIRECTION, 750, ACCOUNT_A);
    const deleted = computeDeleteDelta(INCOME_DIRECTION, 750, ACCOUNT_A);
    expect(recorded[0]!.delta + deleted[0]!.delta).toBe(0);
  });
});

describe("computeUpdateDelta", () => {
  it("nets a same-account amount increase into a single positive delta (Income)", () => {
    // Old amount 1000 reversed (-1000), new amount 1500 applied (+1500) => net +500 on one line.
    expect(computeUpdateDelta(INCOME_DIRECTION, 1000, ACCOUNT_A, 1500, ACCOUNT_A)).toEqual([{ accountId: ACCOUNT_A, delta: 500 }]);
  });

  it("nets a same-account amount decrease into a single negative delta (Expense)", () => {
    // Old amount 1000 reversed (+1000), new amount 600 applied (-600) => net +400 on one line.
    expect(computeUpdateDelta(EXPENSE_DIRECTION, 1000, ACCOUNT_A, 600, ACCOUNT_A)).toEqual([{ accountId: ACCOUNT_A, delta: 400 }]);
  });

  it("produces no line when a same-account update leaves the amount unchanged", () => {
    expect(computeUpdateDelta(INCOME_DIRECTION, 1000, ACCOUNT_A, 1000, ACCOUNT_A)).toEqual([]);
  });

  it("produces two lines when the account changes (Income moved from A to B)", () => {
    const lines = computeUpdateDelta(INCOME_DIRECTION, 1000, ACCOUNT_A, 1200, ACCOUNT_B);
    expect(lines).toEqual([
      { accountId: ACCOUNT_A, delta: -1000 },
      { accountId: ACCOUNT_B, delta: 1200 },
    ]);
  });

  it("produces two lines when the account changes (Expense moved from A to B)", () => {
    const lines = computeUpdateDelta(EXPENSE_DIRECTION, 1000, ACCOUNT_A, 1200, ACCOUNT_B);
    expect(lines).toEqual([
      { accountId: ACCOUNT_A, delta: 1000 },
      { accountId: ACCOUNT_B, delta: -1200 },
    ]);
  });

  it("omits the old-account line when the account changes but the old amount was zero", () => {
    const lines = computeUpdateDelta(INCOME_DIRECTION, 0, ACCOUNT_A, 500, ACCOUNT_B);
    expect(lines).toEqual([{ accountId: ACCOUNT_B, delta: 500 }]);
  });

  it("omits the new-account line when the account changes but the new amount is zero", () => {
    const lines = computeUpdateDelta(INCOME_DIRECTION, 500, ACCOUNT_A, 0, ACCOUNT_B);
    expect(lines).toEqual([{ accountId: ACCOUNT_A, delta: -500 }]);
  });
});
