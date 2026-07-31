import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getMyProfile } from "@/modules/hr/application/employee-portal.service";
import { EmployeeNotFoundError } from "@/modules/hr/domain/errors";
import { resolveCurrentEmployeeId } from "./_lib/resolve-current-employee";

// Employee Portal home/dashboard — mirrors app/parent/page.tsx's own shape: one dashboard read,
// a "no record linked" friendly empty state, then quick-link cards to every sub-page. A missing
// Employee record (e.g. a PARENT or SUPER_ADMIN account with `employee.portal.access` but no HR
// record) is a normal, handled state here — never a thrown 500 or notFound().
export default async function EmployeePortalPage() {
  const authContext = await requireAuthContext();
  await requirePermission("employee.portal.access");

  let employeeId: string;
  try {
    employeeId = await resolveCurrentEmployeeId(authContext.tenantId, authContext.userId);
  } catch (error) {
    if (error instanceof EmployeeNotFoundError) {
      return (
        <main className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-2xl font-semibold text-zinc-900">Employee Portal</h1>
          <p className="mt-4 text-sm text-zinc-500">No employee record is linked to your account. Contact HR.</p>
        </main>
      );
    }
    throw error;
  }

  const profile = await getMyProfile(authContext.tenantId, employeeId);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Employee Portal</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Welcome, {profile.fullName} ({profile.employeeCode}).
      </p>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Department</dt>
            <dd className="mt-1 text-sm text-zinc-900">{profile.departmentName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Designation</dt>
            <dd className="mt-1 text-sm text-zinc-900">{profile.designationName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Employment Type</dt>
            <dd className="mt-1 text-sm text-zinc-900">{profile.employmentTypeName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Employment Status</dt>
            <dd className="mt-1 text-sm text-zinc-900">{profile.employmentStatus}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/employee-portal/profile" className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400">
          <h2 className="text-sm font-medium text-zinc-500">My Profile</h2>
          <p className="mt-2 text-sm text-zinc-700">View and update your personal details.</p>
        </Link>

        <Link href="/employee-portal/attendance" className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400">
          <h2 className="text-sm font-medium text-zinc-500">My Attendance</h2>
          <p className="mt-2 text-sm text-zinc-700">Day-by-day attendance and monthly summary.</p>
        </Link>

        <Link href="/employee-portal/leave" className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400">
          <h2 className="text-sm font-medium text-zinc-500">Leave</h2>
          <p className="mt-2 text-sm text-zinc-700">Check your balance, apply for leave, and track requests.</p>
        </Link>

        <Link href="/employee-portal/payslips" className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400">
          <h2 className="text-sm font-medium text-zinc-500">Payslips</h2>
          <p className="mt-2 text-sm text-zinc-700">View and print your salary history.</p>
        </Link>

        <Link href="/employee-portal/documents" className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400">
          <h2 className="text-sm font-medium text-zinc-500">My Documents</h2>
          <p className="mt-2 text-sm text-zinc-700">Download documents on file with HR.</p>
        </Link>
      </div>
    </main>
  );
}
