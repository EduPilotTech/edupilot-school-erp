// Barrel export for lib/supabase/*. Prefer importing the specific client you need directly
// from its own file (./client, ./server, ./admin) in new code — this barrel exists for the
// short, conventional import names used elsewhere in the codebase and docs.
//
// `supabaseServer` and `supabaseAdmin` are callable functions, not plain client instances:
// `supabaseServer` must be created fresh per request (it's bound to that request's cookies —
// see server.ts), and while `supabaseAdmin` is a cached singleton internally, exposing it as a
// function keeps both exports symmetrical and makes the server-only nature of both obvious at
// every call site (`await supabaseServer()`, `supabaseAdmin()`).
export { getSupabaseBrowserClient as supabaseBrowser } from "./client";
export { getSupabaseServerClient as supabaseServer } from "./server";
export { getSupabaseAdminClient as supabaseAdmin } from "./admin";
