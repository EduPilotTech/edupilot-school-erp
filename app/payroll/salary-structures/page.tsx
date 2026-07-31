import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listSalaryStructures } from "@/modules/payroll/application/salary-structure.service";
import { SalaryStructureManager } from "@/components/features/payroll/SalaryStructureManager";

export default async function SalaryStructuresPage() {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.structure.manage");

  const structures = await listSalaryStructures(authContext.tenantId, authContext.schoolId);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/payroll" className="text-sm text-blue-600 hover:underline">
        ← Payroll
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Salary Structures</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Standing salary templates. Open a structure to manage its earning and deduction components.
      </p>

      <div className="mt-6">
        <SalaryStructureManager schoolId={authContext.schoolId} items={structures} canManage />
      </div>
    </main>
  );
}
