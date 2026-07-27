import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";
import { getUserDetail } from "@/modules/users/application/get-user-detail.service";
import { listAvailableRoles } from "@/modules/users/application/list-available-roles.service";
import {
  suspendUserAction,
  activateUserAction,
  deactivateUserAction,
  deleteUserAction,
  restoreUserAction,
  removeRoleAction,
} from "../actions";
import { UserStatusBadge } from "../_components/user-status-badge";
import { ConfirmActionButton } from "../_components/confirm-action-button";
import { AssignRoleDialog } from "../_components/assign-role-dialog";

interface UserDetailPageProps {
  params: Promise<{ userId: string }>;
}

// Server Component. Every action button below is conditionally rendered via can(authorization,
// "..."), per this step's "hide or disable actions when permission is missing" — but the
// underlying Server Actions (suspendUserAction, etc.) already independently call
// requirePermission() themselves (Sprint 3 — Step 3), so hiding a button here is a UX nicety,
// never the actual enforcement. Self-action buttons (suspend/deactivate/delete on your own
// profile) are hidden outright, matching the "no self lockout" rule the services already
// enforce server-side.
export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = await params;
  const authContext = await requireAuthContext();
  const authorization = await getAuthorizationContext();

  const [detail, availableRoles] = await Promise.all([
    getUserDetail(userId, { tenantId: authContext.tenantId }),
    listAvailableRoles({ tenantId: authContext.tenantId }),
  ]);

  if (!detail) {
    notFound();
  }

  const { profile, roles } = detail;
  const isSelf = profile.id === authContext.userId;
  const assignedRoleIds = new Set(roles.map((role) => role.roleId));
  const assignableRoles = availableRoles
    .filter((role) => !assignedRoleIds.has(role.id))
    .map((role) => ({ id: role.id, name: role.name }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{profile.fullName}</h1>
          <p className="text-sm text-zinc-500">{profile.email ?? "No email on file"}</p>
        </div>
        <UserStatusBadge status={profile.status} deletedAt={profile.deletedAt} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {can(authorization, "user.update") && !profile.deletedAt && (
          <Link
            href={`/settings/users/${profile.id}/edit`}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
          >
            Edit
          </Link>
        )}

        {!isSelf && !profile.deletedAt && profile.status !== "ACTIVE" && can(authorization, "user.activate") && (
          <ConfirmActionButton
            label="Activate"
            confirmMessage="Activate this user?"
            action={() => activateUserAction({ userId: profile.id })}
          />
        )}

        {!isSelf && !profile.deletedAt && profile.status !== "SUSPENDED" && can(authorization, "user.suspend") && (
          <ConfirmActionButton
            label="Suspend"
            confirmMessage="Suspend this user? They will lose access immediately."
            action={() => suspendUserAction({ userId: profile.id })}
            variant="danger"
          />
        )}

        {!isSelf && !profile.deletedAt && profile.status !== "INACTIVE" && can(authorization, "user.deactivate") && (
          <ConfirmActionButton
            label="Deactivate"
            confirmMessage="Mark this user as inactive?"
            action={() => deactivateUserAction({ userId: profile.id })}
            variant="danger"
          />
        )}

        {!isSelf && !profile.deletedAt && can(authorization, "user.delete") && (
          <ConfirmActionButton
            label="Delete"
            confirmMessage="Delete this user? This can be undone with Restore."
            action={() => deleteUserAction({ userId: profile.id })}
            variant="danger"
          />
        )}

        {profile.deletedAt && can(authorization, "user.restore") && (
          <ConfirmActionButton
            label="Restore"
            confirmMessage="Restore this user's access?"
            action={() => restoreUserAction({ userId: profile.id })}
          />
        )}
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Roles</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {roles.map((role) => (
            <li
              key={role.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            >
              <span className="font-medium text-zinc-800">
                {role.roleName}
                {role.roleIsProtected && (
                  <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                    Protected
                  </span>
                )}
              </span>
              {can(authorization, "role.remove") && !profile.deletedAt && (
                <ConfirmActionButton
                  label="Remove"
                  confirmMessage="Remove this role?"
                  action={() => removeRoleAction({ userId: profile.id, roleId: role.roleId })}
                  variant="danger"
                />
              )}
            </li>
          ))}
          {roles.length === 0 && <li className="text-sm text-zinc-500">No roles assigned.</li>}
        </ul>

        {can(authorization, "role.assign") && !profile.deletedAt && assignableRoles.length > 0 && (
          <div className="mt-3">
            <AssignRoleDialog userId={profile.id} availableRoles={assignableRoles} />
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Metadata</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-zinc-500">Phone</dt>
          <dd className="text-zinc-800">{profile.phone ?? "—"}</dd>
          <dt className="text-zinc-500">Last login</dt>
          <dd className="text-zinc-800">
            {profile.lastLoginAt ? profile.lastLoginAt.toLocaleString() : "Never"}
          </dd>
          <dt className="text-zinc-500">Created</dt>
          <dd className="text-zinc-800">{profile.createdAt.toLocaleString()}</dd>
          <dt className="text-zinc-500">Last updated</dt>
          <dd className="text-zinc-800">{profile.updatedAt.toLocaleString()}</dd>
        </dl>
      </section>
    </main>
  );
}
