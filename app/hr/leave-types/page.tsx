import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listLeaveTypes } from "@/modules/hr/application/leave-type.service";
import { LeaveTypeManager } from "@/components/features/hr/LeaveTypeManager";

export default async function LeaveTypesPage() {
  const authContext = await requireAuthContext();
  await requirePermission("hr.leave.manage");

  const leaveTypes = await listLeaveTypes({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/hr" className="text-sm text-blue-600 hover:underline">
        ← HR & Payroll
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Leave Types</h1>
      <p className="mt-1 text-sm text-zinc-500">The leave type master list used for staff leave balances and requests.</p>

      <div className="mt-6">
        <LeaveTypeManager items={leaveTypes} canManage />
      </div>
    </main>
  );
}
