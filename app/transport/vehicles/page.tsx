import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listVehicles } from "@/modules/transport/application/list-vehicles.service";
import { VehicleManager } from "@/components/features/transport/VehicleManager";

export default async function VehiclesPage() {
  const authContext = await requireAuthContext();
  await requirePermission("transport.vehicle.manage");

  const vehicles = await listVehicles({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Vehicles</h1>
      <p className="mt-1 text-sm text-zinc-500">The school&apos;s transport fleet — reused across academic sessions.</p>

      <div className="mt-6">
        <VehicleManager items={vehicles} canManage />
      </div>
    </main>
  );
}
