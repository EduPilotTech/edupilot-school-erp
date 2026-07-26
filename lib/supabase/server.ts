import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

// Server-side Supabase client bound to the current request's cookies.
//
// Deliberately NOT a singleton, unlike the browser client — @supabase/ssr's own guidance is to
// create a new client for every server render, since each one carries a specific request's
// cookie jar. Caching this across requests would leak one request's session into another's.
//
// Safe to call from Server Components and Server Actions. `setAll` is wrapped in a try/catch
// because Server Components have read-only cookies — that failure is expected and harmless
// there as long as `proxy.ts` refreshes the session and re-sets cookies on the response
// (see docs/SECURITY_GUIDELINES.md §3); Server Actions and Route Handlers, which can set
// cookies, will use `setAll` successfully.
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Expected when called from a Server Component — see comment above.
        }
      },
    },
  });
}
