import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getMyPayslipDetail } from "@/modules/hr/application/employee-portal.service";
import { EmployeeNotFoundError } from "@/modules/hr/domain/errors";
import { PayslipNotFoundError } from "@/modules/payroll/domain/errors";
import { resolveCurrentEmployeeId } from "../../_lib/resolve-current-employee";
import { PayslipPrintableView } from "@/components/features/employee-portal/PayslipPrintableView";

interface EmployeePortalPayslipDetailPageProps {
  params: Promise<{ payslipId: string }>;
}

// My Payslip detail — read-only mirror of components/features/payroll/PayslipDetail.tsx's
// earnings/deductions/net-pay layout, with the payment-recording section entirely omitted (that
// is admin-only, in app/payroll/**). Ownership is verified inside getMyPayslipDetail() itself: a
// payslip that exists but belongs to a different employee throws the same PayslipNotFoundError a
// genuinely missing one would, surfaced here as notFound() either way.
export default async function EmployeePortalPayslipDetailPage({ params }: EmployeePortalPayslipDetailPageProps) {
  const { payslipId } = await params;
  const authContext = await requireAuthContext();
  await requirePermission("employee.portal.access");

  let employeeId: string;
  try {
    employeeId = await resolveCurrentEmployeeId(authContext.tenantId, authContext.userId);
  } catch (error) {
    if (error instanceof EmployeeNotFoundError) {
      return (
        <main className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-2xl font-semibold text-zinc-900">Payslip</h1>
          <p className="mt-4 text-sm text-zinc-500">No employee record is linked to your account. Contact HR.</p>
        </main>
      );
    }
    throw error;
  }

  let payslip;
  try {
    payslip = await getMyPayslipDetail(authContext.tenantId, employeeId, payslipId);
  } catch (error) {
    if (error instanceof PayslipNotFoundError) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 print:py-0">
      <div className="print:hidden">
        <Link href="/employee-portal/payslips" className="text-sm text-blue-600 hover:underline">
          ← My Payslips
        </Link>
      </div>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Payslip — {payslip.billingPeriod}</h1>

      <div className="mt-6">
        <PayslipPrintableView payslip={payslip} />
      </div>
    </main>
  );
}
