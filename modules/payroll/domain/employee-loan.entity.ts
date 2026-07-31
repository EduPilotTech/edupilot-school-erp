export type EmployeeLoanTypeValue = "LOAN" | "ADVANCE";
export type EmployeeLoanStatusValue = "ACTIVE" | "CLOSED" | "CANCELLED";

// Covers both "Loan" and "Advance Salary" — structurally identical (principal + monthly
// recovery), distinguished by `loanType`. `outstandingAmount` is transactionally maintained by
// the payroll-run recovery step.
export interface EmployeeLoanEntity {
  id: string;
  tenantId: string;
  employeeId: string;
  loanType: EmployeeLoanTypeValue;
  principalAmount: number;
  monthlyRecoveryAmount: number;
  outstandingAmount: number;
  startDate: Date;
  status: EmployeeLoanStatusValue;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
