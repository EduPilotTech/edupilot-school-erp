import "server-only";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";

// Destroys the current Supabase session and redirects to /login.
//
// The sign-out call's own result isn't branched on: an error here (e.g. the token was already
// invalid) isn't something the user can meaningfully act on — redirect to /login regardless
// rather than leaving them stranded on a broken session. Return type is `never` because
// `redirect()` always throws internally; there is no other exit path from this function.
export async function signOut(): Promise<never> {
  const supabase = await supabaseServer();

  await supabase.auth.signOut();

  redirect("/login");
}
