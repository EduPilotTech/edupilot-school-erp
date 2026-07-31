import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getSalaryStructureWithComponents } from "@/modules/payroll/application/salary-structure.service";
import { SalaryComponentManager } from "@/components/features/payroll/SalaryComponentManager";
import { StatusBadge } from "@/components/features/payroll/StatusBadge";

interface SalaryStructureDetailPageProps {
  params: Promise<{ structureId: string }>;
}

export default async function SalaryStructureDetailPage({ params }: SalaryStructureDetailPageProps) {
  const { structureId } = await params;
  const authContext = await requireAuthContext();
  await requirePermission("payroll.structure.manage");

  const structure = await getSalaryStructureWithComponents(authContext.tenantId, structureId);
  if (!structure) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/payroll/salary-structures" className="text-sm text-blue-600 hover:underline">
        ← Salary Structures
      </Link>
      <div className="mt-2 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900">{structure.name}</h1>
        <StatusBadge status={structure.isActive ? "ACTIVE" : "CLOSED"} />
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        Earning and deduction components applied to every employee assigned to this structure.
      </p>

      <div className="mt-6">
        <SalaryComponentManager salaryStructureId={structure.id} items={structure.components} canManage />
      </div>
    </main>
  );
}
