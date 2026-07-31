import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listEmploymentTypes } from "@/modules/hr/application/employment-type.service";
import { EmploymentTypeManager } from "@/components/features/hr/EmploymentTypeManager";

export default async function EmploymentTypesPage() {
  const authContext = await requireAuthContext();
  await requirePermission("hr.master.manage");

  const employmentTypes = await listEmploymentTypes({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/hr" className="text-sm text-blue-600 hover:underline">
        ← HR & Payroll
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Employment Types</h1>
      <p className="mt-1 text-sm text-zinc-500">The employment type master list (Full Time, Part Time, Contract, and so on).</p>

      <div className="mt-6">
        <EmploymentTypeManager items={employmentTypes} canManage />
      </div>
    </main>
  );
}
