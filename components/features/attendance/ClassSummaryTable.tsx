import type { ClassAttendanceSummaryRow } from "@/modules/attendance/application/dto/attendance-report.dto";

interface ClassSummaryTableProps {
  rows: ClassAttendanceSummaryRow[];
}

// Shared by the Monthly Report and Class-wise Report tabs — both render the same per-student
// aggregate-counts shape (see get-class-attendance-summary.service.ts's own comment), differing
// only in what date range the page passed to the service.
export function ClassSummaryTable({ rows }: ClassSummaryTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">No students found for this class and section.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Admission #</th>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
            <th className="px-4 py-2 text-right font-medium text-zinc-500">Present</th>
            <th className="px-4 py-2 text-right font-medium text-zinc-500">Absent</th>
            <th className="px-4 py-2 text-right font-medium text-zinc-500">Late</th>
            <th className="px-4 py-2 text-right font-medium text-zinc-500">Half Day</th>
            <th className="px-4 py-2 text-right font-medium text-zinc-500">Leave</th>
            <th className="px-4 py-2 text-right font-medium text-zinc-500">Total Marked</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {rows.map((row) => (
            <tr key={row.studentId}>
              <td className="px-4 py-2 text-zinc-700">{row.admissionNumber}</td>
              <td className="px-4 py-2 text-zinc-900">{row.fullName}</td>
              <td className="px-4 py-2 text-right text-zinc-700">{row.counts.PRESENT}</td>
              <td className="px-4 py-2 text-right text-zinc-700">{row.counts.ABSENT}</td>
              <td className="px-4 py-2 text-right text-zinc-700">{row.counts.LATE}</td>
              <td className="px-4 py-2 text-right text-zinc-700">{row.counts.HALF_DAY}</td>
              <td className="px-4 py-2 text-right text-zinc-700">{row.counts.LEAVE}</td>
              <td className="px-4 py-2 text-right font-medium text-zinc-900">{row.counts.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
