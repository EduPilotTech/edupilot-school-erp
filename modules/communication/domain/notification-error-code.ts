// Phase 15B Milestone M1 — the standard Communication Error Code Catalogue, approved in the
// Error Handling Review. Every provider-facing failure (real, once a real Email/SMS/WhatsApp
// provider exists) must classify into exactly one of these codes — never surface a raw provider
// exception anywhere (see classify-provider-error.helpers.ts). `NOTIFICATION_ERROR_MESSAGES` is
// the ONLY source of user-facing text for a given code — deliberately generic, safe to render on
// the Admin UI's Failed Notifications Report with no risk of leaking provider/account detail.
export const NOTIFICATION_ERROR_CODES = {
  // --- Authentication ---------------------------------------------------------------------
  AUTH_NOT_CONFIGURED: "AUTH_NOT_CONFIGURED",
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_EXPIRED_TOKEN: "AUTH_EXPIRED_TOKEN",

  // --- Recipient ----------------------------------------------------------------------------
  RECIPIENT_INVALID: "RECIPIENT_INVALID",
  RECIPIENT_BLOCKED: "RECIPIENT_BLOCKED",

  // --- Provider -----------------------------------------------------------------------------
  PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE",
  PROVIDER_REJECTED: "PROVIDER_REJECTED",
  PROVIDER_QUOTA_EXCEEDED: "PROVIDER_QUOTA_EXCEEDED",

  // --- Queue --------------------------------------------------------------------------------
  QUEUE_MAX_RETRIES_EXCEEDED: "QUEUE_MAX_RETRIES_EXCEEDED",

  // --- Network ------------------------------------------------------------------------------
  NETWORK_TIMEOUT: "NETWORK_TIMEOUT",
  NETWORK_UNREACHABLE: "NETWORK_UNREACHABLE",

  // --- Message ------------------------------------------------------------------------------
  MESSAGE_INVALID_TEMPLATE: "MESSAGE_INVALID_TEMPLATE",
  MESSAGE_CONTENT_REJECTED: "MESSAGE_CONTENT_REJECTED",

  // --- System -------------------------------------------------------------------------------
  // SYSTEM_UNKNOWN_ERROR is the MANDATORY fallback — classifyProviderError() must never return
  // anything else for an exception it cannot confidently categorize.
  SYSTEM_UNKNOWN_ERROR: "SYSTEM_UNKNOWN_ERROR",
  SYSTEM_INTERNAL_ERROR: "SYSTEM_INTERNAL_ERROR",
} as const;

export type NotificationErrorCode = (typeof NOTIFICATION_ERROR_CODES)[keyof typeof NOTIFICATION_ERROR_CODES];

// Deliberately generic — safe to render in any Admin UI, in any server log, in any client-facing
// message. Never interpolate raw provider detail into these strings.
export const NOTIFICATION_ERROR_MESSAGES: Record<NotificationErrorCode, string> = {
  AUTH_NOT_CONFIGURED: "Provider is not configured for this tenant.",
  AUTH_INVALID_CREDENTIALS: "Provider authentication failed.",
  AUTH_EXPIRED_TOKEN: "Provider access token has expired.",

  RECIPIENT_INVALID: "Recipient contact detail is invalid or missing.",
  RECIPIENT_BLOCKED: "Recipient is unreachable by the provider.",

  PROVIDER_UNAVAILABLE: "Provider service is temporarily unavailable.",
  PROVIDER_REJECTED: "Provider rejected the message.",
  PROVIDER_QUOTA_EXCEEDED: "Provider rate limit or quota exceeded.",

  QUEUE_MAX_RETRIES_EXCEEDED: "Maximum retry attempts reached.",

  NETWORK_TIMEOUT: "Request to provider timed out.",
  NETWORK_UNREACHABLE: "Could not reach provider service.",

  MESSAGE_INVALID_TEMPLATE: "Template rendering failed or produced invalid content.",
  MESSAGE_CONTENT_REJECTED: "Message content was rejected by the provider.",

  SYSTEM_UNKNOWN_ERROR: "An unexpected error occurred.",
  SYSTEM_INTERNAL_ERROR: "An internal error occurred while sending this notification.",
};
