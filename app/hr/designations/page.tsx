import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listDesignations } from "@/modules/hr/application/designation.service";
import { listDepartments } from "@/modules/hr/application/department.service";
import { DesignationManager } from "@/components/features/hr/DesignationManager";

export default async function DesignationsPage() {
  const authContext = await requireAuthContext();
  await requirePermission("hr.master.manage");

  const [designations, departments] = await Promise.all([
    listDesignations({ tenantId: authContext.tenantId }),
    listDepartments({ tenantId: authContext.tenantId }),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/hr" className="text-sm text-blue-600 hover:underline">
        ← HR & Payroll
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Designations</h1>
      <p className="mt-1 text-sm text-zinc-500">The designation master list, optionally scoped to a department.</p>

      <div className="mt-6">
        <DesignationManager items={designations} departments={departments} canManage />
      </div>
    </main>
  );
}
