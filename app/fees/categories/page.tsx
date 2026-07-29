import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can, requirePermission } from "@/lib/auth/rbac";
import { listFeeCategories } from "@/modules/fees/application/list-fee-categories.service";
import { FeeCategoryManager } from "@/components/features/fees/FeeCategoryManager";

export default async function FeeCategoriesPage() {
  const authContext = await requireAuthContext();
  await requirePermission("feecategory.view");
  const authorization = await getAuthorizationContext();

  const categories = await listFeeCategories({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Fee Categories</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Tuition, Transport, Hostel, Admission, Exam Fee — reused across academic sessions.
      </p>

      <div className="mt-6">
        <FeeCategoryManager items={categories} canManage={can(authorization, "feecategory.manage")} />
      </div>
    </main>
  );
}
