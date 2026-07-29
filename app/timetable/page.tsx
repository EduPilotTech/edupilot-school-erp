import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";

// Links hub, matching app/attendance/page.tsx's own precedent — no dedicated dashboard pattern
// exists elsewhere in this codebase.
export default async function TimetablePage() {
  await requireAuthContext();
  const authorization = await getAuthorizationContext();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Timetable</h1>
      <p className="mt-1 text-sm text-zinc-500">Build class timetables and view teacher/class/classroom schedules.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {can(authorization, "timetable.manage") && (
          <Link
            href="/timetable/build"
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-300"
          >
            <h2 className="text-base font-semibold text-zinc-900">Timetable Builder</h2>
            <p className="mt-1 text-sm text-zinc-500">Assign subjects and teachers to each class/section&apos;s weekly grid.</p>
          </Link>
        )}

        {can(authorization, "timetable.view") && (
          <Link
            href="/timetable/reports"
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-300"
          >
            <h2 className="text-base font-semibold text-zinc-900">View & Print</h2>
            <p className="mt-1 text-sm text-zinc-500">Teacher, class, and classroom timetables, printable and exportable.</p>
          </Link>
        )}
      </div>
    </main>
  );
}
