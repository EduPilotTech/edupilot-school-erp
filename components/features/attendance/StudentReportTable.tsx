import type { StudentAttendanceReportEntry } from "@/modules/attendance/application/dto/attendance-report.dto";

interface StudentReportTableProps {
  entries: StudentAttendanceReportEntry[];
}

const STATUS_LABELS: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  HALF_DAY: "Half Day",
  LEAVE: "Leave",
};

export function StudentReportTable({ entries }: StudentReportTableProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-zinc-500">No attendance records in this date range.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Date</th>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Remarks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {entries.map((entry) => (
            <tr key={entry.date.toISOString()}>
              <td className="px-4 py-2 text-zinc-700">{entry.date.toISOString().slice(0, 10)}</td>
              <td className="px-4 py-2 text-zinc-900">{STATUS_LABELS[entry.status]}</td>
              <td className="px-4 py-2 text-zinc-500">{entry.remarks ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
