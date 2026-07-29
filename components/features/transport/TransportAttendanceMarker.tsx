"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bulkMarkTransportAttendanceAction } from "@/app/transport/actions";

export interface TransportAttendanceRow {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  stopName: string;
  status: string | null;
}

interface TransportAttendanceMarkerProps {
  routeId: string;
  academicSessionId: string;
  date: string;
  tripLeg: string;
  rows: TransportAttendanceRow[];
}

const STATUS_OPTIONS = ["BOARDED", "ABSENT", "LATE"];

// One route/date/tripLeg, every student on the route marked in a single submit — mirrors
// BulkMarkAttendanceForm's own shape. Marking ABSENT/LATE triggers a parent notification
// server-side (see bulk-mark-transport-attendance.service.ts), not handled here.
export function TransportAttendanceMarker({
  routeId,
  academicSessionId,
  date,
  tripLeg,
  rows,
}: TransportAttendanceMarkerProps) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((row) => [row.studentId, row.status ?? "BOARDED"]))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setStatus(studentId: string, status: string) {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  }

  function markAllBoarded() {
    setStatuses(Object.fromEntries(rows.map((row) => [row.studentId, "BOARDED"])));
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const result = await bulkMarkTransportAttendanceAction({
        routeId,
        academicSessionId,
        date,
        tripLeg,
        entries: rows.map((row) => ({ studentId: row.studentId, status: statuses[row.studentId] })),
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setMessage(`Attendance saved for ${rows.length} student(s).`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">No students assigned to this route yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={markAllBoarded}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Mark all boarded
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save Attendance"}
        </button>
        {message && <span className="text-sm text-emerald-700">{message}</span>}
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Admission #</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Stop</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {rows.map((row) => (
              <tr key={row.studentId}>
                <td className="px-4 py-2 text-zinc-700">{row.admissionNumber}</td>
                <td className="px-4 py-2 text-zinc-900">{row.fullName}</td>
                <td className="px-4 py-2 text-zinc-700">{row.stopName}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-3">
                    {STATUS_OPTIONS.map((status) => (
                      <label key={status} className="flex items-center gap-1 text-xs text-zinc-700">
                        <input
                          type="radio"
                          name={`status-${row.studentId}`}
                          checked={statuses[row.studentId] === status}
                          onChange={() => setStatus(row.studentId, status)}
                        />
                        {status}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
