import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

// Wraps the one Supabase Auth ADMIN operation user invitation needs. Uses the service-role
// client (lib/supabase/admin.ts) internally, but exposes only this narrow function — never the
// raw admin client itself — to the rest of modules/users.
//
// This is a deliberate, narrow exception to docs/SECURITY_GUIDELINES.md §5's rule restricting
// the admin client to modules/tenancy/infrastructure and background jobs: `inviteUserByEmail`
// is a Supabase Auth-admin operation — it creates/manages `auth.users` rows and sends a
// privileged email — it does not read or write our own RLS-protected Postgres tables at all.
// That restriction exists to prevent feature code from casually bypassing RLS on tenant data,
// which this call cannot do. Confining the raw admin client import to this one adapter file
// (rather than invite-user.service.ts reaching for supabaseAdmin() directly) keeps that
// distinction enforceable and auditable in one place, rather than open to reinterpretation at
// every call site.
export interface InviteUserByEmailResult {
  authUserId: string;
}

export async function inviteUserByEmail(
  email: string,
  metadata: Record<string, unknown>,
  tenantId: string
): Promise<{ success: true; data: InviteUserByEmailResult } | { success: false; message: string }> {
  const admin = supabaseAdmin();

  // `redirectTo` (the page a clicked invite link lands on) is intentionally omitted — no
  // accept-invitation page exists yet ("no UI" this sprint). Supabase falls back to its
  // configured project Site URL until that page is built and wired in here, matching the same
  // deliberate omission already made in modules/auth/application/forgot-password.service.ts.
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: metadata,
  });

  if (error || !data.user) {
    return { success: false, message: error?.message ?? "Unknown error inviting user." };
  }

  // Completion Pass — Storage RLS verification (checklist #14): `metadata`/`data` above sets
  // `user_metadata`, which the user can later overwrite themselves via
  // `supabase.auth.updateUser()` — unsafe to use as a Storage RLS tenant claim (see
  // setUserTenantMetadata's own comment). A separate, admin-only `app_metadata` write is
  // required; best-effort here (unlike register-school.service.ts's version) since the invited
  // user and UserProfile row are both already fully created at this point — failing the whole
  // invite over this one follow-up call would be worse than an admin invited today simply not
  // yet being able to satisfy a future Storage RLS policy until this is retried.
  await admin.auth.admin
    .updateUserById(data.user.id, { app_metadata: { tenant_id: tenantId } })
    .catch(() => {});

  return { success: true, data: { authUserId: data.user.id } };
}
