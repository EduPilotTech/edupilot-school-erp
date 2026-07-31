import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listDepartments } from "@/modules/hr/application/department.service";
import { DepartmentManager } from "@/components/features/hr/DepartmentManager";

export default async function DepartmentsPage() {
  const authContext = await requireAuthContext();
  await requirePermission("hr.master.manage");

  const departments = await listDepartments({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/hr" className="text-sm text-blue-600 hover:underline">
        ← HR & Payroll
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Departments</h1>
      <p className="mt-1 text-sm text-zinc-500">The department master list used across employee and designation records.</p>

      <div className="mt-6">
        <DepartmentManager items={departments} canManage />
      </div>
    </main>
  );
}
