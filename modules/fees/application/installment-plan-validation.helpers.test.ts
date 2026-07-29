import { describe, expect, it } from "vitest";
import { validateInstallmentPlanItems } from "./installment-plan-validation.helpers";

describe("validateInstallmentPlanItems", () => {
  it("accepts a valid plan whose percentages sum to 100", () => {
    const result = validateInstallmentPlanItems([
      { installmentNumber: 1, percentageOfTotal: 50, dueDayOffset: 0 },
      { installmentNumber: 2, percentageOfTotal: 50, dueDayOffset: 180 },
    ]);
    expect(result).toBeNull();
  });

  it("rejects an empty plan", () => {
    expect(validateInstallmentPlanItems([])).toMatch(/at least one installment/i);
  });

  it("rejects non-sequential installment numbers", () => {
    const result = validateInstallmentPlanItems([
      { installmentNumber: 1, percentageOfTotal: 50, dueDayOffset: 0 },
      { installmentNumber: 3, percentageOfTotal: 50, dueDayOffset: 180 },
    ]);
    expect(result).toMatch(/sequential/i);
  });

  it("rejects percentages that don't add up to 100", () => {
    const result = validateInstallmentPlanItems([
      { installmentNumber: 1, percentageOfTotal: 40, dueDayOffset: 0 },
      { installmentNumber: 2, percentageOfTotal: 40, dueDayOffset: 180 },
    ]);
    expect(result).toMatch(/100%/);
  });

  it("tolerates a tiny floating-point rounding error", () => {
    const result = validateInstallmentPlanItems([
      { installmentNumber: 1, percentageOfTotal: 33.34, dueDayOffset: 0 },
      { installmentNumber: 2, percentageOfTotal: 33.33, dueDayOffset: 90 },
      { installmentNumber: 3, percentageOfTotal: 33.33, dueDayOffset: 180 },
    ]);
    expect(result).toBeNull();
  });
});
