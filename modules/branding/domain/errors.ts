import { BusinessRuleError } from "@/lib/errors";

// Product Completion Phase 17 Bundle A. Local to this module rather than reused from
// modules/students/domain/errors.ts's DocumentTooLargeError/UnsupportedFileTypeError — a
// cross-module domain import would couple Branding to Students for no shared meaning beyond
// coincidentally similar wording (see docs/PROJECT_ARCHITECTURE.md's module-boundary rule: a
// module's domain layer must not import another module's domain layer).
export class UnsupportedBrandingAssetTypeError extends BusinessRuleError {
  constructor(message = "This file type is not accepted for branding assets.") {
    super(message);
  }
}

export class BrandingAssetTooLargeError extends BusinessRuleError {
  constructor(message = "File is too large.") {
    super(message);
  }
}
