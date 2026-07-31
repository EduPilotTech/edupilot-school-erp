// Phase 13 — 1:1 sensitive-data detail table, isolated from Employee's own columns. No
// `deletedAt` column on this model (schema-verified) — it is not soft-deletable, only
// upserted, matching the "1:1 detail table, no soft delete" shape used elsewhere in this
// codebase.
export interface EmployeeBankDetailEntity {
  id: string;
  tenantId: string;
  employeeId: string;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  branchName: string | null;
  ifscCode: string;
  accountType: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
