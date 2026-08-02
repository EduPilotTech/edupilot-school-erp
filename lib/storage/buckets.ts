// Sprint 4.8B — known Supabase Storage bucket names. Centralized so a bucket name is never
// hand-typed at more than one call site. This bucket must be provisioned (created, with
// appropriate Storage RLS policies) in the Supabase project before any upload against it will
// succeed at runtime — that provisioning is outside this repository's scope (see Sprint 4.8A's
// and this sprint's final reports).
export const STUDENT_DOCUMENTS_BUCKET = "student-documents";

// Phase 13 — same "must be provisioned externally" caveat as STUDENT_DOCUMENTS_BUCKET above:
// this bucket (and its Storage RLS policies) must be created in the Supabase project before any
// upload against it will succeed at runtime.
export const EMPLOYEE_DOCUMENTS_BUCKET = "employee-documents";

// Phase 16 Bundle C — same "must be provisioned externally" caveat as STUDENT_DOCUMENTS_BUCKET
// above: this bucket (and its Storage RLS policies) must be created in the Supabase project
// before any upload against it will succeed at runtime.
export const PLATFORM_INVOICES_BUCKET = "platform-invoices";

// Product Completion Phase 17 Bundle A — School Branding assets (logo, principal signature,
// school seal). Same "must be provisioned externally" caveat as every bucket above.
export const SCHOOL_BRANDING_BUCKET = "school-branding";
