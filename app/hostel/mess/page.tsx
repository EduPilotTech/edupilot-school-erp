import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listHostels } from "@/modules/hostel/application/list-hostels.service";
import { listMessMealPlans } from "@/modules/hostel/application/list-mess-meal-plans.service";
import { MessMealPlanManager } from "@/components/features/hostel/MessMealPlanManager";

interface MessPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MessPage({ searchParams }: MessPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.mess.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const hostels = await listHostels({ tenantId: authContext.tenantId }, { isActive: true });
  const hostelId = first(params.hostelId) || hostels[0]?.id || "";

  const plans = hostelId ? await listMessMealPlans({ tenantId: authContext.tenantId }, hostelId) : [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Mess Management</h1>
      <p className="mt-1 text-sm text-zinc-500">Meal plans for a hostel. Open a plan to manage its meals.</p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="hostelId" className="text-xs font-medium text-zinc-500">
            Hostel
          </label>
          <select
            id="hostelId"
            name="hostelId"
            defaultValue={hostelId}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {hostels.map((hostel) => (
              <option key={hostel.id} value={hostel.id}>
                {hostel.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Switch Hostel
        </button>
      </form>

      <div className="mt-6">
        {hostels.length === 0 ? (
          <p className="text-sm text-zinc-500">No hostels yet — create one under Hostels first.</p>
        ) : (
          <MessMealPlanManager hostelId={hostelId} items={plans} canManage />
        )}
      </div>
    </main>
  );
}
