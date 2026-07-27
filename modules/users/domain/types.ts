// Shared result/error shape for modules/users application services — parallels
// modules/auth/application/sign-in.service.ts's AuthResult<T>, for the same reason: outcomes
// like "duplicate invitation" or "cannot suspend yourself" are expected, common, user-facing
// results a future Server Action needs to render as inline feedback, not exceptional
// conditions. docs/CODING_STANDARDS.md §5 describes a throw-based typed-error convention via
// lib/errors.ts, which does not exist yet in this codebase; this Result-based approach is used
// instead for the same reasons already established in modules/auth, not a departure from it.

export type UserServiceErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE_INVITATION"
  | "CROSS_TENANT"
  | "SELF_ACTION_NOT_ALLOWED"
  | "INVALID_STATE"
  | "UNKNOWN_ERROR";

export interface UserServiceError {
  code: UserServiceErrorCode;
  message: string;
}

export type UserServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: UserServiceError };
