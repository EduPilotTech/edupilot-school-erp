import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env";

type SupabaseAdminClient = ReturnType<typeof createClient>;

// Service-role Supabase client — BYPASSES ROW LEVEL SECURITY ENTIRELY.
//
// Restricted, per docs/SECURITY_GUIDELINES.md §5, to:
//   - modules/tenancy/infrastructure (tenant provisioning)
//   - background jobs
// Never import this inside a per-tenant feature module, Server Component, or Server Action.
//
// The `import "server-only"` above turns an accidental client-bundle import into a build-time
// error, not a runtime secret leak — but it does not stop a misguided *server-side* import from
// a module that shouldn't have it (e.g. a feature module reaching for a shortcut around RLS).
// That boundary still needs a `no-restricted-imports` lint rule and code review; see
// docs/SECURITY_GUIDELINES.md §5.
//
// Stateless and not request-bound (no user session, no cookies) — safe to cache as a singleton,
// unlike the per-request server client.
let adminClient: SupabaseAdminClient | undefined;

export function getSupabaseAdminClient(): SupabaseAdminClient {
  if (!adminClient) {
    adminClient = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminClient;
}
