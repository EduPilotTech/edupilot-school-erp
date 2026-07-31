import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getMyLeaveBalance, getMyLeaveHistory } from "@/modules/hr/application/employee-portal.service";
import { listLeaveTypes } from "@/modules/hr/application/leave-type.service";
import { EmployeeNotFoundError } from "@/modules/hr/domain/errors";
import { resolveCurrentEmployeeId } from "../_lib/resolve-current-employee";
import { LeavePortalManager } from "@/components/features/employee-portal/LeavePortalManager";

function currentYear(): number {
  return new Date().getFullYear();
}

// My Leave — (1) current-year balance, (2) apply-for-leave form, (3) leave history with cancel.
// Balance is a plain read-only table rendered here; the apply form + history + cancel button
// live in the client LeavePortalManager component (mirrors LeaveRequestManager's shape).
export default async function EmployeePortalLeavePage() {
  const authContext = await requireAuthContext();
  await requirePermission("employee.portal.access");

  let employeeId: string;
  try {
    employeeId = await resolveCurrentEmployeeId(authContext.tenantId, authContext.userId);
  } catch (error) {
    if (error instanceof EmployeeNotFoundError) {
      return (
        <main className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-2xl font-semibold text-zinc-900">Leave</h1>
          <p className="mt-4 text-sm text-zinc-500">No employee record is linked to your account. Contact HR.</p>
        </main>
      );
    }
    throw error;
  }

  const year = currentYear();
  const [balances, history, leaveTypes] = await Promise.all([
    getMyLeaveBalance(authContext.tenantId, employeeId, year),
    getMyLeaveHistory(authContext.tenantId, employeeId),
    listLeaveTypes({ tenantId: authContext.tenantId }, { isActive: true }),
  ]);

  const leaveTypeNameById = new Map(leaveTypes.map((lt) => [lt.id, lt.name]));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/employee-portal" className="text-sm text-blue-600 hover:underline">
        ← Employee Portal
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Leave</h1>
      <p className="mt-1 text-sm text-zinc-500">Your {year} leave balance, and your leave requests.</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Leave Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Allocated</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Used</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Carried Forward</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Available</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {balances.map((balance) => (
              <tr key={balance.id}>
                <td className="px-4 py-2 text-zinc-900">{leaveTypeNameById.get(balance.leaveTypeId) ?? balance.leaveTypeId}</td>
                <td className="px-4 py-2 text-zinc-700">{balance.allocatedDays}</td>
                <td className="px-4 py-2 text-zinc-700">{balance.usedDays}</td>
                <td className="px-4 py-2 text-zinc-700">{balance.carriedForwardDays}</td>
                <td className="px-4 py-2 text-zinc-700">{balance.availableDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {balances.length === 0 && <p className="p-4 text-sm text-zinc-500">No leave balance allocated for {year} yet.</p>}
      </div>

      <div className="mt-8">
        <LeavePortalManager
          history={history}
          leaveTypeOptions={leaveTypes.map((leaveType) => ({ id: leaveType.id, name: leaveType.name }))}
        />
      </div>
    </main>
  );
}
