import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>;

// Module-level singleton — @supabase/ssr's own guidance is to reuse one browser client
// instance rather than constructing a new GoTrueClient on every call, which can otherwise
// cause duplicate auth-state listeners and conflicting in-memory session state.
let browserClient: SupabaseBrowserClient | undefined;

// Browser-side Supabase client. Safe to import from Client Components — uses only the public
// URL and anon key; access is governed entirely by Row Level Security (docs/SECURITY_GUIDELINES.md
// §5), not by any secret this file holds.
//
// Not yet typed against a generated `Database` schema — no migration exists yet to generate one
// from (see docs/DATABASE_STANDARDS.md §6). Wire in `supabase gen types typescript` output as
// `createBrowserClient<Database>(...)` once the first migration lands.
export function getSupabaseBrowserClient(): SupabaseBrowserClient {
  if (!browserClient) {
    browserClient = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return browserClient;
}
