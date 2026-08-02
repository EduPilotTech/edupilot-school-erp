import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

// Mirrors modules/users/infrastructure/supabase-invite.adapter.ts's own "deliberate, narrow
// exception" to docs/SECURITY_GUIDELINES.md §5's admin-client restriction: this is a Supabase
// Auth-admin operation (creates an `auth.users` row) — it never reads or writes our own
// RLS-protected Postgres tables, so it cannot be used to bypass RLS on tenant data. Confined to
// this one adapter file, exactly like the invite adapter, rather than letting
// register-school.service.ts reach for `supabaseAdmin()` directly.
//
// Unlike `inviteUserByEmail` (which creates a passwordless account and emails an invite link,
// for an ADMIN inviting someone else), this creates the account with the password the person
// just typed into the registration form themselves, and marks the email pre-confirmed — there is
// no one else to send a confirmation link to during self-service registration, and requiring an
// email round-trip before the very first login would be a UX dead end for a fresh signup.
export interface CreateAuthUserResult {
  authUserId: string;
}

export async function createAuthUserWithPassword(
  email: string,
  password: string,
  metadata: Record<string, unknown>
): Promise<{ success: true; data: CreateAuthUserResult } | { success: false; message: string }> {
  const admin = supabaseAdmin();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error || !data.user) {
    return { success: false, message: error?.message ?? "Unknown error creating account." };
  }

  return { success: true, data: { authUserId: data.user.id } };
}

// Cleanup path for register-school.service.ts: if the Postgres-side Tenant/School/UserProfile
// transaction fails AFTER the Supabase Auth user was already created, the orphaned auth user
// must be removed — otherwise a retried registration with the same email would hit Supabase's
// own "email already registered" error with no corresponding application data to show for it.
export async function deleteAuthUser(authUserId: string): Promise<void> {
  const admin = supabaseAdmin();
  await admin.auth.admin.deleteUser(authUserId);
}

// Completion Pass — Storage RLS verification (checklist #14). Writes `tenant_id` into the auth
// user's `app_metadata` (admin-only, NOT `user_metadata` — that field is self-editable via
// `supabase.auth.updateUser()`, which would let a user forge their own tenant claim and defeat
// exactly the isolation this exists for). This is the prerequisite a Storage RLS policy like
// `(storage.foldername(name))[1] = auth.jwt() -> 'app_metadata' ->> 'tenant_id'` needs to exist —
// see supabase/policies/storage-rls.sql for the actual policy SQL and why creating it can't be
// automated from this codebase (no direct Postgres connection to the Supabase project, only this
// REST-based Admin API). Called once, right after the Tenant row is created (tenantId doesn't
// exist yet when the auth user itself is created — see register-school.service.ts's own
// chicken-and-egg comment), and also from inviteUserByEmail for the same reason.
export async function setUserTenantMetadata(authUserId: string, tenantId: string): Promise<void> {
  const admin = supabaseAdmin();
  const { error } = await admin.auth.admin.updateUserById(authUserId, {
    app_metadata: { tenant_id: tenantId },
  });
  if (error) {
    throw new Error(`Failed to set tenant metadata on auth user: ${error.message}`);
  }
}
