import "server-only";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

// Session-refresh cookie plumbing for proxy.ts (Next.js 16's renamed middleware.ts).
//
// Deliberately separate from lib/supabase/server.ts: that file uses next/headers' cookies(),
// which is a Server Component/Action API and is not available in proxy.ts. Proxy operates on
// NextRequest/NextResponse directly, per @supabase/ssr's own documented middleware pattern —
// see https://supabase.com/docs/guides/auth/server-side/nextjs.
//
// This is intentionally the ONLY thing this helper does: refresh the session and hand back the
// resulting user (or null) plus the response carrying any refreshed cookies. It does not read
// UserProfile, Role, or Permission — see docs/SECURITY_GUIDELINES.md §2 and §3 on why proxy.ts
// must never perform authorization checks or query the database.
export async function updateSupabaseSession(
  request: NextRequest
): Promise<{ response: NextResponse; user: User | null }> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refreshes the access token if it's near/past expiry, invoking `setAll` above as a side
  // effect. `getUser()` (not `getSession()`) is used deliberately — it revalidates the token
  // against Supabase Auth rather than trusting an unverified value decoded from the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
