// Platform-ops — the one hybrid: `tenantId` is NULLABLE (unlike every other audit log in this
// codebase). Most rows are about one tenant's billing action, but a BillingRun-lock or catalog
// edit isn't about any single tenant. Mirrors FeeAuditLogEntity/PayrollAuditLogEntity field-for-
// field otherwise.
export interface PlatformAuditLogEntity {
  id: string;
  tenantId: string | null;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState: unknown;
  afterState: unknown;
  createdAt: Date;
}
