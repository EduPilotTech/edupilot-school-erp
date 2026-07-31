// Pure — no "server-only", no Prisma import — so this, the core payroll calculation engine, can
// be unit-tested directly, mirroring modules/hr/application/leave-balance.helpers.ts's own
// "pure logic kept separate from server-only files" pattern.
import type { SalaryComponentEntity, SalaryComponentTypeValue } from "../domain/salary-structure.entity";
import type { EmploymentStatusValue } from "@/modules/hr/domain/employee.entity";

export interface ComputedSalaryLine {
  name: string;
  componentType: SalaryComponentTypeValue;
  amount: number;
  salaryComponentId: string;
}

export interface ComputeGrossAndDeductionsResult {
  earnings: ComputedSalaryLine[];
  deductions: ComputedSalaryLine[];
  grossEarnings: number;
  totalDeductions: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// The core payroll calculation engine. For each ACTIVE component: FLAT contributes its `value`
// verbatim; PERCENTAGE_OF_BASIC contributes `value`% of `basicSalary`. Components are bucketed by
// `componentType` into earnings vs. deductions. Inactive/soft-deleted components must be filtered
// out by the caller before calling this (it trusts the list it's given).
export function computeGrossAndDeductions(
  basicSalary: number,
  components: SalaryComponentEntity[]
): ComputeGrossAndDeductionsResult {
  const earnings: ComputedSalaryLine[] = [];
  const deductions: ComputedSalaryLine[] = [];

  for (const component of components) {
    const amount = round2(
      component.calculationType === "FLAT" ? component.value : (component.value / 100) * basicSalary
    );
    const line: ComputedSalaryLine = {
      name: component.name,
      componentType: component.componentType,
      amount,
      salaryComponentId: component.id,
    };
    if (component.componentType === "EARNING") {
      earnings.push(line);
    } else {
      deductions.push(line);
    }
  }

  const grossEarnings = round2(earnings.reduce((sum, line) => sum + line.amount, 0));
  const totalDeductions = round2(deductions.reduce((sum, line) => sum + line.amount, 0));

  return { earnings, deductions, grossEarnings, totalDeductions };
}

// Payroll eligibility by employment status: ACTIVE/ON_PROBATION/ON_LEAVE all draw salary;
// SUSPENDED/RESIGNED/TERMINATED/RETIRED do not (encodes the payroll processing brief's own
// eligibility rule as a single pure, unit-testable predicate).
export function isPayrollEligible(status: EmploymentStatusValue): boolean {
  return status === "ACTIVE" || status === "ON_PROBATION" || status === "ON_LEAVE";
}

export interface LoanForReversal {
  id: string;
  monthlyRecoveryAmount: number;
  principalAmount: number;
  outstandingAmount: number;
}

export interface LoanReversalLine {
  loanId: string;
  amount: number;
}

// Regeneration must undo a payslip's previously-applied loan recovery before reapplying the
// freshly computed amount (never double-apply). The schema stores only the payslip's aggregate
// `loanRecoveryAmount`, not a per-loan breakdown, so this distributes that total back across the
// employee's loans in the same order forward recovery iterates them (createdAt ascending),
// reversing at most each loan's own `monthlyRecoveryAmount` and never restoring
// `outstandingAmount` past its original `principalAmount`. This exactly undoes a prior forward
// recovery pass produced by the same deterministic ordering, provided no other recovery has
// touched these loans in between (true in practice: a loan is only ever recovered from during
// payroll-run processing, and regeneration is only permitted before the run locks).
export function distributeLoanReversal(totalToReverse: number, loansOldestFirst: LoanForReversal[]): LoanReversalLine[] {
  let remaining = Math.round(totalToReverse * 100) / 100;
  const lines: LoanReversalLine[] = [];

  for (const loan of loansOldestFirst) {
    if (remaining <= 0) break;
    const maxRestorable = Math.round((loan.principalAmount - loan.outstandingAmount) * 100) / 100;
    const amount = Math.round(Math.min(remaining, loan.monthlyRecoveryAmount, maxRestorable) * 100) / 100;
    if (amount > 0) {
      lines.push({ loanId: loan.id, amount });
      remaining = Math.round((remaining - amount) * 100) / 100;
    }
  }

  return lines;
}
