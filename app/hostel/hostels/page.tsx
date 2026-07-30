import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listHostels } from "@/modules/hostel/application/list-hostels.service";
import { HostelManager } from "@/components/features/hostel/HostelManager";

export default async function HostelsPage() {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.manage");

  const hostels = await listHostels({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Hostels</h1>
      <p className="mt-1 text-sm text-zinc-500">Open a hostel to manage its buildings, floors, wings, and rooms.</p>

      <div className="mt-6">
        <HostelManager items={hostels} canManage />
      </div>
    </main>
  );
}
