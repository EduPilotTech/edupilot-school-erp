"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bulkMarkAttendanceAction } from "@/app/attendance/actions";
import { ATTENDANCE_STATUS_OPTIONS } from "./attendance.types";

export interface BulkMarkAttendanceRow {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  status: string | null;
}

interface BulkMarkAttendanceFormProps {
  academicSessionId: string;
  classId: string;
  sectionId: string;
  date: string;
  rows: BulkMarkAttendanceRow[];
}

// Powers Daily Attendance, Bulk Mark Attendance, and Class-wise Attendance in one component —
// the three are the same underlying action (mark every student in one class/section for one
// day), differing only in framing, not behavior. Every row defaults to its already-saved status
// (from the Daily Attendance report this page also uses), or PRESENT for a student with no
// record yet — re-submitting corrects a day rather than being blocked, matching
// mark-student-attendance.service.ts's upsert semantics.
export function BulkMarkAttendanceForm({
  academicSessionId,
  classId,
  sectionId,
  date,
  rows,
}: BulkMarkAttendanceFormProps) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((row) => [row.studentId, row.status ?? "PRESENT"]))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setStatus(studentId: string, status: string) {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  }

  function markAllPresent() {
    setStatuses(Object.fromEntries(rows.map((row) => [row.studentId, "PRESENT"])));
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const result = await bulkMarkAttendanceAction({
        academicSessionId,
        classId,
        sectionId,
        date,
        entries: rows.map((row) => ({ studentId: row.studentId, status: statuses[row.studentId] })),
      });

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      setMessage(`Attendance saved for ${result.data.length} student(s).`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">No students found for this class and section.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={markAllPresent}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Mark All Present
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save Attendance"}
        </button>
      </div>

      {message && (
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">{message}</p>
      )}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

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
                <td className="px-4 py-2">
                  <select
                    value={statuses[row.studentId]}
                    onChange={(event) => setStatus(row.studentId, event.target.value)}
                    className="rounded-lg border border-zinc-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
