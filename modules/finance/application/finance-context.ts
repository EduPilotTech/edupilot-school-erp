// Shared context type for every modules/finance application service — mirrors HrContext's/
// LibraryContext's own "one central file owns the type" pattern (see
// modules/hr/application/hr-context.ts) so every service imports the same interface rather than
// each redeclaring an equivalent shape.
export interface FinanceContext {
  tenantId: string;
  actingUserId: string;
}
