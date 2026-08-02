import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { SCHOOL_BRANDING_BUCKET } from "@/lib/storage/buckets";

// Completion Pass — Login page branding (checklist #1). A deliberate, narrow exception to
// docs/SECURITY_GUIDELINES.md §5's admin-client restriction, mirroring
// modules/auth/infrastructure/supabase-admin-user.adapter.ts's own "deliberate, narrow
// exception" comment: get-public-school-branding.service.ts runs BEFORE authentication (there is
// no session, so lib/storage/supabase-storage.service.ts's session-bound client has no identity
// to sign a URL as), for a school's own already-public logo. Confined to this one function —
// never exposes the raw admin client — so the exception stays auditable in one place.
export async function signPublicBrandingLogoUrl(logoKey: string): Promise<string | null> {
  const admin = supabaseAdmin();
  const { data, error } = await admin.storage.from(SCHOOL_BRANDING_BUCKET).createSignedUrl(logoKey, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}
