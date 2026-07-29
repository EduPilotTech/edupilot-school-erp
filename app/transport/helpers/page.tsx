import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listHelpers } from "@/modules/transport/application/list-helpers.service";
import { HelperManager } from "@/components/features/transport/HelperManager";

export default async function HelpersPage() {
  const authContext = await requireAuthContext();
  await requirePermission("transport.helper.manage");

  const helpers = await listHelpers({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Helpers</h1>
      <p className="mt-1 text-sm text-zinc-500">Conductors/attendants — no portal login this phase.</p>

      <div className="mt-6">
        <HelperManager items={helpers} canManage />
      </div>
    </main>
  );
}
