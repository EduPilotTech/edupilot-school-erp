import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";

// Links hub, matching app/attendance/page.tsx and app/timetable/page.tsx's own precedent.
export default async function ExaminationsPage() {
  await requireAuthContext();
  const authorization = await getAuthorizationContext();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Examinations</h1>
      <p className="mt-1 text-sm text-zinc-500">Exams, marks entry, results, report cards, and promotion.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {can(authorization, "exam.view") && (
          <Link href="/examinations/exams" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-300">
            <h2 className="text-base font-semibold text-zinc-900">Exams</h2>
            <p className="mt-1 text-sm text-zinc-500">Create exams, configure subjects, and advance the exam lifecycle.</p>
          </Link>
        )}
        {can(authorization, "examtype.view") && (
          <Link href="/examinations/exam-types" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-300">
            <h2 className="text-base font-semibold text-zinc-900">Exam Types</h2>
            <p className="mt-1 text-sm text-zinc-500">Unit Test, Mid Term, Final, and other exam categories.</p>
          </Link>
        )}
        {can(authorization, "marks.entry") && (
          <Link href="/examinations/marks" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-300">
            <h2 className="text-base font-semibold text-zinc-900">Marks Entry</h2>
            <p className="mt-1 text-sm text-zinc-500">Enter or bulk-enter marks for an exam subject.</p>
          </Link>
        )}
        {can(authorization, "result.generate") && (
          <Link href="/examinations/results" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-300">
            <h2 className="text-base font-semibold text-zinc-900">Results</h2>
            <p className="mt-1 text-sm text-zinc-500">Generate results, view rankings, and publish.</p>
          </Link>
        )}
        {can(authorization, "reportcard.print") && (
          <Link href="/examinations/report-cards" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-300">
            <h2 className="text-base font-semibold text-zinc-900">Report Cards</h2>
            <p className="mt-1 text-sm text-zinc-500">Printable report cards and student progress reports.</p>
          </Link>
        )}
        {can(authorization, "student.promote") && (
          <Link href="/students/promotion" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-300">
            <h2 className="text-base font-semibold text-zinc-900">Promotion</h2>
            <p className="mt-1 text-sm text-zinc-500">Promote students to the next academic session.</p>
          </Link>
        )}
      </div>
    </main>
  );
}
