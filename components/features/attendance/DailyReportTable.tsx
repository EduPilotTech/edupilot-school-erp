import type { DailyAttendanceReportRow } from "@/modules/attendance/application/dto/attendance-report.dto";

interface DailyReportTableProps {
  rows: DailyAttendanceReportRow[];
}

const STATUS_LABELS: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  HALF_DAY: "Half Day",
  LEAVE: "Leave",
};

export function DailyReportTable({ rows }: DailyReportTableProps) {
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
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {rows.map((row) => (
            <tr key={row.studentId}>
              <td className="px-4 py-2 text-zinc-700">{row.admissionNumber}</td>
              <td className="px-4 py-2 text-zinc-900">{row.fullName}</td>
              <td className="px-4 py-2 text-zinc-700">
                {row.status ? STATUS_LABELS[row.status] : <span className="text-zinc-400">Not Marked</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
