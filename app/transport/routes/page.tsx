import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listRoutes } from "@/modules/transport/application/list-routes.service";
import { RouteManager } from "@/components/features/transport/RouteManager";

export default async function RoutesPage() {
  const authContext = await requireAuthContext();
  await requirePermission("transport.route.manage");

  const routes = await listRoutes({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Routes</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Reused across academic sessions. Open a route to manage its stops, vehicle assignment, and fee rule.
      </p>

      <div className="mt-6">
        <RouteManager items={routes} canManage />
      </div>
    </main>
  );
}
