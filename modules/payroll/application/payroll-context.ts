// Own equivalent of modules/hr/application/hr-context.ts — deliberately not cross-imported, so
// modules/payroll stays decoupled from modules/hr, mirroring how every other module owns its own
// Context type (LibraryContext, HostelContext, ...).
export interface PayrollContext {
  tenantId: string;
  actingUserId: string;
}
