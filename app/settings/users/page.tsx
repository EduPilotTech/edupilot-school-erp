import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listUsers } from "@/modules/users/application/list-users.service";
import { listAvailableRoles } from "@/modules/users/application/list-available-roles.service";
import { UserStatusBadge } from "./_components/user-status-badge";
import { PaginationLinks } from "./_components/pagination-links";

interface UsersListPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Server Component. Viewing this page requires only an authenticated, ACTIVE tenant member
// (via requireAuthContext()) — no dedicated "view users" permission was ever defined anywhere
// in this project (Sprint 1B's example permission codes only covered mutations), so this page
// deliberately does not invent one. Individual ACTIONS within the page (Invite User, etc.) are
// what's actually gated, per this step's "hide or disable actions when permission is missing."
export default async function UsersListPage({ searchParams }: UsersListPageProps) {
  const authContext = await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const params = await searchParams;

  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const [{ items, total, page, pageSize }, roles] = await Promise.all([
    listUsers(
      {
        search: first(params.search),
        status: first(params.status),
        roleId: first(params.roleId),
        page: first(params.page),
        pageSize: first(params.pageSize),
      },
      { tenantId: authContext.tenantId }
    ),
    listAvailableRoles({ tenantId: authContext.tenantId }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Users</h1>
        {can(authorization, "user.invite") && (
          <Link
            href="/settings/users/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Invite User
          </Link>
        )}
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="search" className="text-xs font-medium text-zinc-500">
            Search
          </label>
          <input
            id="search"
            name="search"
            defaultValue={first(params.search) ?? ""}
            placeholder="Name or email"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs font-medium text-zinc-500">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={first(params.status) ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="INVITED">Invited</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="roleId" className="text-xs font-medium text-zinc-500">
            Role
          </label>
          <select
            id="roleId"
            name="roleId"
            defaultValue={first(params.roleId) ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Filter
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((user) => (
              <tr key={user.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3 font-medium text-zinc-900">{user.fullName}</td>
                <td className="px-4 py-3 text-zinc-600">{user.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <UserStatusBadge status={user.status} deletedAt={user.deletedAt} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/settings/users/${user.id}`} className="text-blue-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationLinks page={page} totalPages={totalPages} searchParams={params} />
    </main>
  );
}
