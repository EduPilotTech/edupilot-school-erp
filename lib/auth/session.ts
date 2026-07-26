import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase";

// Returns the current Supabase session, or null if there is none / it is invalid.
//
// Deliberately verifies via `getUser()` first, not `getSession()` alone: Supabase's own
// guidance is that the user object returned by `getSession()` is read straight from the cookie
// and is not guaranteed authentic in server-side code — `getUser()` revalidates against
// Supabase Auth. Only once that succeeds do we read the full Session payload.
//
// Wrapped in React's `cache()` so multiple calls within the same request (e.g. from several
// Server Components in one render tree) share one Supabase round-trip instead of repeating it.
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
});

// Same resolution, but redirects to /login rather than returning null — for Server
// Components/Actions that require an authenticated session to proceed.
//
// This is a UX convenience, not the authorization boundary — see docs/SECURITY_GUIDELINES.md
// §2: a Server Action is directly reachable regardless of proxy.ts's matcher coverage, so
// calling requireSession() here is what actually enforces authentication for that action, not
// the fact that proxy.ts happened to already redirect anonymous requests for most routes.
export async function requireSession(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
