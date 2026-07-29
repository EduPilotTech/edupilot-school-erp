"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bulkEnterMarksAction } from "@/app/examinations/marks/actions";

export interface MarksEntryRow {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  marksObtained: number | null;
  isAbsent: boolean;
}

interface MarksEntryGridProps {
  examSubjectId: string;
  maxMarks: number;
  passingMarks: number;
  rows: MarksEntryRow[];
}

// Bulk marks entry — one exam subject, every student in the class/section, saved atomically.
// Same shape as BulkMarkAttendanceForm: each row defaults to its already-saved mark (or blank),
// re-submitting corrects it rather than being blocked (bulk-enter-marks.service.ts upserts).
export function MarksEntryGrid({ examSubjectId, maxMarks, passingMarks, rows }: MarksEntryGridProps) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, { marks: string; isAbsent: boolean }>>(() =>
    Object.fromEntries(
      rows.map((row) => [
        row.studentId,
        { marks: row.marksObtained !== null ? String(row.marksObtained) : "", isAbsent: row.isAbsent },
      ])
    )
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateDraft(studentId: string, patch: Partial<{ marks: string; isAbsent: boolean }>) {
    setDrafts((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }));
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const result = await bulkEnterMarksAction({
        examSubjectId,
        entries: rows.map((row) => {
          const draft = drafts[row.studentId];
          return {
            studentId: row.studentId,
            isAbsent: draft.isAbsent,
            marksObtained: draft.isAbsent || draft.marks === "" ? undefined : Number(draft.marks),
          };
        }),
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setMessage(`Marks saved for ${result.data.length} student(s).`);
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
        <p className="text-sm text-zinc-500">
          Max marks: {maxMarks} · Passing marks: {passingMarks}
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save Marks"}
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
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Marks</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Absent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {rows.map((row) => {
              const draft = drafts[row.studentId];
              return (
                <tr key={row.studentId}>
                  <td className="px-4 py-2 text-zinc-700">{row.admissionNumber}</td>
                  <td className="px-4 py-2 text-zinc-900">{row.fullName}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      max={maxMarks}
                      value={draft.marks}
                      disabled={draft.isAbsent}
                      onChange={(e) => updateDraft(row.studentId, { marks: e.target.value })}
                      className="w-24 rounded-lg border border-zinc-300 px-2 py-1 text-sm disabled:bg-zinc-100"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={draft.isAbsent}
                      onChange={(e) => updateDraft(row.studentId, { isAbsent: e.target.checked })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
