import type { StudentProgressReportDTO } from "@/modules/examinations/application/dto/progress-report.dto";

interface ProgressReportTableProps {
  report: StudentProgressReportDTO;
}

export function ProgressReportTable({ report }: ProgressReportTableProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-900">{report.fullName}</h2>
      <p className="text-sm text-zinc-500">Admission #{report.admissionNumber}</p>

      {report.entries.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No published results yet.</p>
      ) : (
        <table className="mt-4 min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-zinc-500">Exam</th>
              <th className="px-3 py-2 text-right font-medium text-zinc-500">Percentage</th>
              <th className="px-3 py-2 text-left font-medium text-zinc-500">Grade</th>
              <th className="px-3 py-2 text-right font-medium text-zinc-500">Rank</th>
              <th className="px-3 py-2 text-left font-medium text-zinc-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {report.entries.map((entry) => (
              <tr key={entry.examId}>
                <td className="px-3 py-2 text-zinc-900">{entry.examName}</td>
                <td className="px-3 py-2 text-right text-zinc-700">{entry.percentage.toFixed(1)}%</td>
                <td className="px-3 py-2 text-zinc-700">{entry.overallGrade ?? "—"}</td>
                <td className="px-3 py-2 text-right text-zinc-700">{entry.rank ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-700">{entry.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
