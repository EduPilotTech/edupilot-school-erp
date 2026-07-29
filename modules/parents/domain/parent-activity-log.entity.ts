// Unifies Parent Activity Log (requirement 21) and the messaging audit-log requirement
// (requirement 17) in one append-only record — `action` values cover both portal activity
// ("VIEWED_REPORT_CARD", "DOWNLOADED_RECEIPT", "LOGGED_IN") and messaging audit events
// ("MESSAGE_SENT") rather than two near-duplicate tables (Phase 9 Decision 6).
export interface ParentActivityLogEntity {
  id: string;
  tenantId: string;
  guardianId: string;
  userProfileId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: Date;
}
