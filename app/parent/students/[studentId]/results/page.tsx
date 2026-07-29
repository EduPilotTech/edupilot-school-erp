import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getMyProgressReport } from "@/modules/parents/application/get-my-progress-report.service";

interface PageProps {
  params: Promise<{ studentId: string }>;
}

// Examination Results (requirement 7) — reuses get-student-progress-report.service.ts (Phase 7),
// which only ever surfaces published ExamResult rows.
export default async function ParentStudentResultsPage({ params }: PageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("parent.result.view");
  const { studentId } = await params;

  const report = await getMyProgressReport(studentId, {
    tenantId: authContext.tenantId,
    userProfileId: authContext.userId,
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Examination Results</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {report.fullName} · Admission #{report.admissionNumber}
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Exam</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Percentage</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Grade</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Rank</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Report Card</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {report.entries.map((entry) => (
              <tr key={entry.examId}>
                <td className="px-4 py-2 text-zinc-900">{entry.examName}</td>
                <td className="px-4 py-2 text-zinc-700">{entry.percentage}%</td>
                <td className="px-4 py-2 text-zinc-700">{entry.overallGrade ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{entry.rank ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{entry.status}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/parent/students/${studentId}/results/${entry.examId}/report-card`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Download
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {report.entries.length === 0 && <p className="p-4 text-sm text-zinc-500">No published results yet.</p>}
      </div>
    </main>
  );
}
