// Sprint 4.8B — known Supabase Storage bucket names. Centralized so a bucket name is never
// hand-typed at more than one call site. This bucket must be provisioned (created, with
// appropriate Storage RLS policies) in the Supabase project before any upload against it will
// succeed at runtime — that provisioning is outside this repository's scope (see Sprint 4.8A's
// and this sprint's final reports).
export const STUDENT_DOCUMENTS_BUCKET = "student-documents";
