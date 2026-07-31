import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listPayrollRuns } from "@/modules/payroll/application/payroll-run.service";
import { PayrollRunListManager } from "@/components/features/payroll/PayrollRunListManager";

export default async function PayrollRunsPage() {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.run.manage");

  const runs = await listPayrollRuns(authContext.tenantId, authContext.schoolId);
  const sortedRuns = [...runs].sort((a, b) => (a.billingPeriod < b.billingPeriod ? 1 : -1));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/payroll" className="text-sm text-blue-600 hover:underline">
        ← Payroll
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Payroll Runs</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Create a monthly payroll run, then process it to generate payslips for every payroll-eligible employee.
      </p>

      <div className="mt-6">
        <PayrollRunListManager schoolId={authContext.schoolId} items={sortedRuns} />
      </div>
    </main>
  );
}
