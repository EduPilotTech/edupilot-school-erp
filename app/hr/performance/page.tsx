import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listEmployees } from "@/modules/hr/application/employee.service";
import { listPerformanceReviews } from "@/modules/hr/application/performance-review.service";
import { PerformanceReviewManager } from "@/components/features/hr/PerformanceReviewManager";
import type { PerformanceReviewDTO } from "@/modules/hr/application/dto/performance-review.dto";

interface PerformanceReviewsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// listPerformanceReviews (modules/hr/application/performance-review.service.ts) only supports
// "all reviews for one employee" — there is no repository method for "all reviews across every
// employee" (PerformanceReviewRepository exposes findById/findByEmployee only, and modules/hr
// is off-limits to modify for this task). To still offer a school-wide list, this page fans out
// one findByEmployee call per active employee and merges the results client-side — acceptable at
// typical school staff-roster sizes (capped at the 100-row page listEmployees allows), and the
// optional ?employeeId= filter narrows it back down to Phase 13 spec's single-employee case.
export default async function PerformanceReviewsPage({ searchParams }: PerformanceReviewsPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hr.performance.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const employeeIdFilter = first(params.employeeId) || undefined;

  const employeeResult = await listEmployees({ page: 1, pageSize: 100 }, { tenantId: authContext.tenantId });
  const activeEmployees = employeeResult.items.filter((employee) => employee.isActive);

  const employeesToQuery = employeeIdFilter
    ? activeEmployees.filter((employee) => employee.id === employeeIdFilter)
    : activeEmployees;

  const reviewLists = await Promise.all(
    employeesToQuery.map((employee) => listPerformanceReviews(authContext.tenantId, employee.id))
  );

  const reviews: PerformanceReviewDTO[] = reviewLists
    .flat()
    .sort((a, b) => (a.reviewPeriodEnd < b.reviewPeriodEnd ? 1 : -1));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/hr" className="text-sm text-blue-600 hover:underline">
        ← HR & Payroll
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Performance Reviews</h1>
      <p className="mt-1 text-sm text-zinc-500">Record and review staff performance evaluations.</p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="employeeId" className="text-xs font-medium text-zinc-500">
            Employee
          </label>
          <select
            id="employeeId"
            name="employeeId"
            defaultValue={employeeIdFilter ?? ""}
            className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All Employees</option>
            {activeEmployees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName} ({employee.employeeCode})
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Filter
        </button>
      </form>

      <div className="mt-6">
        <PerformanceReviewManager
          items={reviews}
          employeeOptions={activeEmployees.map((employee) => ({
            id: employee.id,
            fullName: employee.fullName,
            employeeCode: employee.employeeCode,
          }))}
          canManage
        />
      </div>
    </main>
  );
}
