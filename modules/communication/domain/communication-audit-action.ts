// Phase 15B Milestone M4 — the closed set of Communication audit actions approved in the Error
// Handling Review's Audit Logging Strategy. This is an interim, in-memory/log-only audit
// mechanism (no `CommunicationAuditLog` table exists yet — that requires a migration, explicitly
// out of scope for this milestone); every action here is exactly the set flagged mandatory or
// recommended in that review.
export const COMMUNICATION_AUDIT_ACTIONS = {
  PROVIDER_CONFIGURATION_UPDATED: "PROVIDER_CONFIGURATION_UPDATED",
  PROVIDER_ENABLED: "PROVIDER_ENABLED",
  PROVIDER_DISABLED: "PROVIDER_DISABLED",
  CREDENTIAL_ROTATED: "CREDENTIAL_ROTATED",
  PROVIDER_TEST_CONNECTION: "PROVIDER_TEST_CONNECTION",
  QUEUE_RETRY: "QUEUE_RETRY",
  QUEUE_CANCEL: "QUEUE_CANCEL",
  MANUAL_SEND: "MANUAL_SEND",
  HEALTH_CHECK: "HEALTH_CHECK",
} as const;

export type CommunicationAuditAction = (typeof COMMUNICATION_AUDIT_ACTIONS)[keyof typeof COMMUNICATION_AUDIT_ACTIONS];

export type CommunicationAuditStatus = "SUCCESS" | "FAILURE";
