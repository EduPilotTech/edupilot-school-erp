"use server";

// Thin Server Actions only, matching every other actions.ts in this codebase — no business
// logic here. Wraps the three fully-real, already-built auth application services
// (sign-in.service.ts, register-school.service.ts, sign-out.service.ts) so the (auth) pages and
// the navigation shell's "Log out" button have something to actually call.
import { redirect } from "next/navigation";
import { signIn } from "@/modules/auth/application/sign-in.service";
import { signOut } from "@/modules/auth/application/sign-out.service";
import { registerSchool, type RegisterSchoolInput } from "@/modules/auth/application/register-school.service";
import {
  getPublicSchoolBranding,
  type PublicSchoolBrandingDTO,
} from "@/modules/branding/application/get-public-school-branding.service";

export type AuthFormActionResult = { success: true } | { success: false; error: string };

// Completion Pass — Login page branding (checklist #1). Public, unauthenticated by design (see
// getPublicSchoolBranding's own comment on exactly what it does and doesn't expose).
export async function lookupSchoolBrandingAction(slug: string): Promise<PublicSchoolBrandingDTO | null> {
  return getPublicSchoolBranding(slug);
}

// Signs the user in via Supabase Auth (password never leaves the server). On success, redirects
// to /dashboard — deliberately called OUTSIDE any try/catch, matching sign-out.service.ts's own
// use of redirect() in this codebase: redirect() throws internally, and nothing here needs to
// intercept that throw.
export async function loginAction(input: unknown): Promise<AuthFormActionResult> {
  const result = await signIn(input as { email: string; password: string });

  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  redirect("/dashboard");
}

// Bootstraps a brand-new tenant (Tenant + School + UserProfile + SCHOOL_ADMIN role), then signs
// the new admin in immediately — registerSchool() only creates the Supabase Auth account, it
// does not itself establish a session. If registration succeeds but the immediate sign-in fails
// for some reason (e.g. rate limiting), the account still exists and is usable, so this sends
// the admin to /login to try again rather than leaving them on a dead end.
export async function registerSchoolAction(input: unknown): Promise<AuthFormActionResult> {
  const result = await registerSchool(input);

  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  const { adminEmail, adminPassword } = input as RegisterSchoolInput;
  const signInResult = await signIn({ email: adminEmail, password: adminPassword });

  if (!signInResult.success) {
    redirect("/login");
  }

  redirect("/dashboard");
}

// Destroys the current session and redirects to /login — signOut() does both itself.
export async function logoutAction(): Promise<void> {
  await signOut();
}
