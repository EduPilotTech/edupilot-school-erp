import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listAvailableRoles } from "@/modules/users/application/list-available-roles.service";
import { InviteUserForm } from "../_components/invite-user-form";

// Server Component wrapper — the permission check happens here, not just by hiding the "Invite
// User" link on the list page. requirePermission() calls Next's notFound() internally if the
// caller lacks user.invite, so reaching this page without the permission never renders the form
// at all, regardless of how the user navigated here.
export default async function InviteUserPage() {
  const authContext = await requireAuthContext();
  await requirePermission("user.invite");

  const roles = await listAvailableRoles({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Invite User</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Sends an email invitation via Supabase. The user completes their own signup from there.
      </p>
      <InviteUserForm roles={roles.map((role) => ({ id: role.id, name: role.name }))} />
    </main>
  );
}
