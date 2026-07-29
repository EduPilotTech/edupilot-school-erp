export interface FeeAuditLogEntity {
  id: string;
  tenantId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState: unknown;
  afterState: unknown;
  createdAt: Date;
}
