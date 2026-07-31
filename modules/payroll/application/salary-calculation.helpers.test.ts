import { describe, expect, it } from "vitest";
import { computeGrossAndDeductions, distributeLoanReversal, isPayrollEligible } from "./salary-calculation.helpers";
import type { SalaryComponentEntity } from "../domain/salary-structure.entity";
import type { LoanForReversal } from "./salary-calculation.helpers";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

function makeComponent(overrides: Partial<SalaryComponentEntity>): SalaryComponentEntity {
  return {
    id: VALID_UUID,
    tenantId: VALID_UUID,
    salaryStructureId: VALID_UUID,
    name: "Component",
    code: "COMP",
    componentType: "EARNING",
    calculationType: "FLAT",
    value: 0,
    isStatutory: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
    ...overrides,
  };
}

describe("computeGrossAndDeductions", () => {
  it("computes a FLAT earning verbatim", () => {
    const result = computeGrossAndDeductions(30000, [
      makeComponent({ name: "House Rent Allowance", code: "HRA", componentType: "EARNING", calculationType: "FLAT", value: 5000 }),
    ]);
    expect(result.earnings).toEqual([
      { name: "House Rent Allowance", componentType: "EARNING", amount: 5000, salaryComponentId: VALID_UUID },
    ]);
    expect(result.grossEarnings).toBe(5000);
    expect(result.totalDeductions).toBe(0);
  });

  it("computes a PERCENTAGE_OF_BASIC deduction relative to basicSalary", () => {
    const result = computeGrossAndDeductions(30000, [
      makeComponent({ name: "Provident Fund", code: "PF", componentType: "DEDUCTION", calculationType: "PERCENTAGE_OF_BASIC", value: 12 }),
    ]);
    expect(result.deductions).toEqual([
      { name: "Provident Fund", componentType: "DEDUCTION", amount: 3600, salaryComponentId: VALID_UUID },
    ]);
    expect(result.totalDeductions).toBe(3600);
    expect(result.grossEarnings).toBe(0);
  });

  it("buckets a mix of FLAT and PERCENTAGE_OF_BASIC earnings and deductions correctly", () => {
    const result = computeGrossAndDeductions(20000, [
      makeComponent({ id: "1", name: "Basic-linked DA", code: "DA", componentType: "EARNING", calculationType: "PERCENTAGE_OF_BASIC", value: 10 }),
      makeComponent({ id: "2", name: "Conveyance", code: "CONV", componentType: "EARNING", calculationType: "FLAT", value: 1500 }),
      makeComponent({ id: "3", name: "Professional Tax", code: "PT", componentType: "DEDUCTION", calculationType: "FLAT", value: 200 }),
      makeComponent({ id: "4", name: "Provident Fund", code: "PF", componentType: "DEDUCTION", calculationType: "PERCENTAGE_OF_BASIC", value: 12 }),
    ]);

    expect(result.earnings).toHaveLength(2);
    expect(result.deductions).toHaveLength(2);
    // DA = 10% of 20000 = 2000; + Conveyance 1500 = 3500
    expect(result.grossEarnings).toBe(3500);
    // PT 200 + PF 12% of 20000 = 2400 => 2600
    expect(result.totalDeductions).toBe(2600);
  });

  it("rounds fractional percentage amounts to 2 decimal places", () => {
    const result = computeGrossAndDeductions(10000, [
      makeComponent({ name: "Odd Percentage", code: "ODD", componentType: "EARNING", calculationType: "PERCENTAGE_OF_BASIC", value: 3.333 }),
    ]);
    expect(result.earnings[0]!.amount).toBe(333.3);
  });

  it("returns zero gross and deductions when given no components", () => {
    const result = computeGrossAndDeductions(50000, []);
    expect(result.grossEarnings).toBe(0);
    expect(result.totalDeductions).toBe(0);
    expect(result.earnings).toEqual([]);
    expect(result.deductions).toEqual([]);
  });
});

describe("isPayrollEligible", () => {
  it("is eligible for ACTIVE, ON_PROBATION, and ON_LEAVE", () => {
    expect(isPayrollEligible("ACTIVE")).toBe(true);
    expect(isPayrollEligible("ON_PROBATION")).toBe(true);
    expect(isPayrollEligible("ON_LEAVE")).toBe(true);
  });

  it("is not eligible for SUSPENDED, RESIGNED, TERMINATED, or RETIRED", () => {
    expect(isPayrollEligible("SUSPENDED")).toBe(false);
    expect(isPayrollEligible("RESIGNED")).toBe(false);
    expect(isPayrollEligible("TERMINATED")).toBe(false);
    expect(isPayrollEligible("RETIRED")).toBe(false);
  });
});

describe("distributeLoanReversal", () => {
  function makeLoan(overrides: Partial<LoanForReversal>): LoanForReversal {
    return { id: "loan-1", monthlyRecoveryAmount: 1000, principalAmount: 10000, outstandingAmount: 5000, ...overrides };
  }

  it("reverses the full amount onto a single loan that has room", () => {
    const loan = makeLoan({ id: "loan-1", monthlyRecoveryAmount: 1000, principalAmount: 10000, outstandingAmount: 5000 });
    const lines = distributeLoanReversal(1000, [loan]);
    expect(lines).toEqual([{ loanId: "loan-1", amount: 1000 }]);
  });

  it("spills over to the next loan (in order) once the first is capped at its own monthlyRecoveryAmount", () => {
    const loanA = makeLoan({ id: "loan-a", monthlyRecoveryAmount: 600, principalAmount: 10000, outstandingAmount: 5000 });
    const loanB = makeLoan({ id: "loan-b", monthlyRecoveryAmount: 800, principalAmount: 10000, outstandingAmount: 6000 });
    const lines = distributeLoanReversal(1000, [loanA, loanB]);
    expect(lines).toEqual([
      { loanId: "loan-a", amount: 600 },
      { loanId: "loan-b", amount: 400 },
    ]);
  });

  it("never restores a loan's outstandingAmount past its own principalAmount", () => {
    // Only 500 was actually recovered so far (outstanding 9500 of 10000 principal), even though
    // monthlyRecoveryAmount is 1000 — the loan can only be restored by the 500 that was taken.
    const loan = makeLoan({ id: "loan-1", monthlyRecoveryAmount: 1000, principalAmount: 10000, outstandingAmount: 9500 });
    const lines = distributeLoanReversal(1000, [loan]);
    expect(lines).toEqual([{ loanId: "loan-1", amount: 500 }]);
  });

  it("produces no lines when there is nothing to reverse", () => {
    const loan = makeLoan({});
    expect(distributeLoanReversal(0, [loan])).toEqual([]);
  });

  it("exactly undoes a forward recovery pass across two loans", () => {
    // Forward pass recovered min(600, outstanding) from loan A and min(800, outstanding) from
    // loan B, totaling 1400. Reversing 1400 in the same order must restore both loans exactly.
    const loanAAfterRecovery = makeLoan({ id: "loan-a", monthlyRecoveryAmount: 600, principalAmount: 10000, outstandingAmount: 4400 });
    const loanBAfterRecovery = makeLoan({ id: "loan-b", monthlyRecoveryAmount: 800, principalAmount: 10000, outstandingAmount: 5200 });
    const lines = distributeLoanReversal(1400, [loanAAfterRecovery, loanBAfterRecovery]);
    expect(lines).toEqual([
      { loanId: "loan-a", amount: 600 },
      { loanId: "loan-b", amount: 800 },
    ]);
  });
});
