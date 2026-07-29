import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";

// Phase 5 — Attendance Management landing page. A simple links hub (no dedicated dashboard
// pattern exists elsewhere in this codebase to follow — see app/settings, which has no index
// page either), gating each link on the same permission code its destination page enforces
// itself, matching app/students/page.tsx's "New Admission" link precedent.
export default async function AttendancePage() {
  await requireAuthContext();
  const authorization = await getAuthorizationContext();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Attendance</h1>
      <p className="mt-1 text-sm text-zinc-500">Mark daily attendance and view attendance reports.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {can(authorization, "attendance.student.mark") && (
          <Link
            href="/attendance/mark"
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-300"
          >
            <h2 className="text-base font-semibold text-zinc-900">Mark Attendance</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Daily, bulk, and class-wise attendance marking for students.
            </p>
          </Link>
        )}

        {can(authorization, "attendance.student.view") && (
          <Link
            href="/attendance/reports"
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-300"
          >
            <h2 className="text-base font-semibold text-zinc-900">Reports</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Daily, monthly, class-wise, and student-wise attendance reports.
            </p>
          </Link>
        )}
      </div>
    </main>
  );
}
