"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { promoteStudentsAction } from "@/app/students/promotion/actions";

interface PromotionRow {
  studentId: string;
  admissionNumber: string;
  fullName: string;
}

interface PromotionFormProps {
  sourceAcademicSessionId: string;
  targetAcademicSessionId: string;
  rows: PromotionRow[];
  classOptions: { id: string; name: string }[];
  sectionOptions: { id: string; name: string }[];
}

// Bulk promotion — reuses Enrollment.close()+create() directly (Phase 7 Decision 2, no
// Promotion model). Every selected student gets the same target class/section — promoting a
// whole section together. Students who need a different target (e.g. re-sectioning) can be
// unchecked here and promoted separately with a different bulk target.
export function PromotionForm({
  sourceAcademicSessionId,
  targetAcademicSessionId,
  rows,
  classOptions,
  sectionOptions,
}: PromotionFormProps) {
  const router = useRouter();
  const [bulkClassId, setBulkClassId] = useState("");
  const [bulkSectionId, setBulkSectionId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(rows.map((row) => row.studentId)));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleSelected(studentId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  }

  async function handlePromote() {
    setIsSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const promotions = rows
        .filter((row) => selected.has(row.studentId))
        .map((row) => ({ studentId: row.studentId, targetClassId: bulkClassId, targetSectionId: bulkSectionId }));

      const result = await promoteStudentsAction({
        sourceAcademicSessionId,
        targetAcademicSessionId,
        promotions,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setMessage(`Promoted ${result.data.length} student(s).`);
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
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="bulk-class" className="text-xs font-medium text-zinc-500">
            Promote To Class
          </label>
          <select
            id="bulk-class"
            value={bulkClassId}
            onChange={(e) => setBulkClassId(e.target.value)}
            className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select class</option>
            {classOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="bulk-section" className="text-xs font-medium text-zinc-500">
            Section
          </label>
          <select
            id="bulk-section"
            value={bulkSectionId}
            onChange={(e) => setBulkSectionId(e.target.value)}
            className="w-40 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select section</option>
            {sectionOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handlePromote}
          disabled={isSubmitting || !bulkClassId || !bulkSectionId || selected.size === 0}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Promoting…" : `Promote ${selected.size} Student(s)`}
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
              <th className="px-4 py-2 text-left font-medium text-zinc-500">
                <input
                  type="checkbox"
                  checked={selected.size === rows.length}
                  onChange={(e) =>
                    setSelected(e.target.checked ? new Set(rows.map((row) => row.studentId)) : new Set())
                  }
                />
              </th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Admission #</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {rows.map((row) => (
              <tr key={row.studentId}>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(row.studentId)}
                    onChange={() => toggleSelected(row.studentId)}
                  />
                </td>
                <td className="px-4 py-2 text-zinc-700">{row.admissionNumber}</td>
                <td className="px-4 py-2 text-zinc-900">{row.fullName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
