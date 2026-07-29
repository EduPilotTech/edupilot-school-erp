import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listDrivers } from "@/modules/transport/application/list-drivers.service";
import { DriverManager } from "@/components/features/transport/DriverManager";

export default async function DriversPage() {
  const authContext = await requireAuthContext();
  await requirePermission("transport.driver.manage");

  const drivers = await listDrivers({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Drivers</h1>
      <p className="mt-1 text-sm text-zinc-500">No portal login this phase — records-management only.</p>

      <div className="mt-6">
        <DriverManager items={drivers} canManage />
      </div>
    </main>
  );
}
