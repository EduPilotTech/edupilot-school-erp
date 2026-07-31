import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getPayrollRun, listPayslips } from "@/modules/payroll/application/payroll-run.service";
import { listEmployees } from "@/modules/hr/application/employee.service";
import { PayrollRunDetail } from "@/components/features/payroll/PayrollRunDetail";

interface PayrollRunDetailPageProps {
  params: Promise<{ payrollRunId: string }>;
}

export default async function PayrollRunDetailPage({ params }: PayrollRunDetailPageProps) {
  const { payrollRunId } = await params;
  const authContext = await requireAuthContext();
  await requirePermission("payroll.run.manage");

  const run = await getPayrollRun(authContext.tenantId, payrollRunId);
  if (!run) notFound();

  // listEmployees is capped at pageSize 100 by its own zod schema — acceptable at typical school
  // staff-roster sizes (same tradeoff app/hr/performance/page.tsx already made); any payslip whose
  // employee falls outside that page falls back to showing the raw employeeId.
  const [payslips, employeeResult] = await Promise.all([
    listPayslips(authContext.tenantId, { payrollRunId }),
    listEmployees({ page: 1, pageSize: 100 }, { tenantId: authContext.tenantId }),
  ]);

  const employeeNameById = Object.fromEntries(
    employeeResult.items.map((employee) => [employee.id, `${employee.fullName} (${employee.employeeCode})`])
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/payroll/runs" className="text-sm text-blue-600 hover:underline">
        ← Payroll Runs
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Payroll Run — {run.billingPeriod}</h1>

      <div className="mt-6">
        <PayrollRunDetail run={run} payslips={payslips} employeeNameById={employeeNameById} />
      </div>
    </main>
  );
}
