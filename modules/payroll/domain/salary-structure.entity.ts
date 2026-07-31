// Named template, deliberately NOT session-scoped (unlike FeeStructure) — a salary structure is a
// standing HR template ("Standard Teaching Staff"), not tied to an academic year. Mirrors
// FeeStructure's own container shape (see modules/fees/domain/fee-structure.entity.ts).
export interface SalaryStructureEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export type SalaryComponentTypeValue = "EARNING" | "DEDUCTION";
export type SalaryCalculationTypeValue = "FLAT" | "PERCENTAGE_OF_BASIC";

// The item within a SalaryStructure — mirrors FeeStructureItem's "item under a container" shape.
export interface SalaryComponentEntity {
  id: string;
  tenantId: string;
  salaryStructureId: string;
  name: string;
  code: string;
  componentType: SalaryComponentTypeValue;
  calculationType: SalaryCalculationTypeValue;
  // Flat currency amount when calculationType=FLAT, or a percentage (0-100) of the employee's
  // basicSalary when calculationType=PERCENTAGE_OF_BASIC.
  value: number;
  isStatutory: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
