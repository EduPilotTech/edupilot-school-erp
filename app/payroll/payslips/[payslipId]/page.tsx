import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { getPayslip } from "@/modules/payroll/application/payroll-run.service";
import { listSalaryPayments } from "@/modules/payroll/application/salary-payment.service";
import { getEmployeeById } from "@/modules/hr/application/employee.service";
import { EmployeeNotFoundError } from "@/modules/hr/domain/errors";
import { PayslipDetail } from "@/components/features/payroll/PayslipDetail";

interface PayslipDetailPageProps {
  params: Promise<{ payslipId: string }>;
}

// Reachable from the Payroll Run detail screen ("View Detail"), which already requires
// payroll.run.manage — that is this page's own base view permission. Recording/reversing a
// payment is gated separately behind payroll.payment.manage (a narrower, payment-specific
// permission per the RBAC code list), matching PaymentHistoryTable's own
// "view is broader than mutate" precedent in components/features/fees.
export default async function PayslipDetailPage({ params }: PayslipDetailPageProps) {
  const { payslipId } = await params;
  const authContext = await requireAuthContext();
  await requirePermission("payroll.run.manage");
  const authorization = await getAuthorizationContext();
  const canManagePayments = can(authorization, "payroll.payment.manage");

  const payslip = await getPayslip(authContext.tenantId, payslipId);
  if (!payslip) notFound();

  const payments = await listSalaryPayments(authContext.tenantId, { payslipId: payslip.id });

  let employeeLabel = payslip.employeeId;
  try {
    const employee = await getEmployeeById(payslip.employeeId, { tenantId: authContext.tenantId });
    employeeLabel = `${employee.fullName} (${employee.employeeCode})`;
  } catch (error) {
    if (!(error instanceof EmployeeNotFoundError)) throw error;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href={`/payroll/runs/${payslip.payrollRunId}`} className="text-sm text-blue-600 hover:underline">
        ← Payroll Run
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Payslip — {payslip.billingPeriod}</h1>
      <p className="mt-1 text-sm text-zinc-500">{employeeLabel}</p>

      <div className="mt-6">
        <PayslipDetail payslip={payslip} payments={payments} canManagePayments={canManagePayments} employeeLabel={employeeLabel} />
      </div>
    </main>
  );
}
