// Shared context type for every modules/hr application service — mirrors LibraryContext's own
// "one central file owns the type" pattern (see modules/library/application/library.service.ts)
// so every service imports the same interface rather than each redeclaring an equivalent shape.
export interface HrContext {
  tenantId: string;
  actingUserId: string;
}
