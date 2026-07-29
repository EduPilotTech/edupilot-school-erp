"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addExamSubjectAction } from "@/app/examinations/actions";

interface ExamSubjectRow {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  maxMarks: number;
  passingMarks: number;
}

interface ExamSubjectManagerProps {
  examId: string;
  rows: ExamSubjectRow[];
  classOptions: { id: string; name: string }[];
  subjectOptions: { id: string; name: string }[];
  canManage: boolean;
}

// Only addable while the exam is DRAFT or SCHEDULED — enforced server-side
// (add-exam-subject.service.ts); this form is simply hidden once the exam has moved past that
// (via `canManage`, which the page computes from the exam's own status alongside the
// permission check).
export function ExamSubjectManager({ examId, rows, classOptions, subjectOptions, canManage }: ExamSubjectManagerProps) {
  const router = useRouter();
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [passingMarks, setPassingMarks] = useState("33");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await addExamSubjectAction({
        examId,
        classId,
        subjectId,
        maxMarks: Number(maxMarks),
        passingMarks: Number(passingMarks),
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setSubjectId("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="es-class" className="text-xs font-medium text-zinc-500">
              Class
            </label>
            <select
              id="es-class"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-40 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
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
            <label htmlFor="es-subject" className="text-xs font-medium text-zinc-500">
              Subject
            </label>
            <select
              id="es-subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-40 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              <option value="">Select subject</option>
              {subjectOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="es-max" className="text-xs font-medium text-zinc-500">
              Max Marks
            </label>
            <input
              id="es-max"
              type="number"
              min={1}
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="es-pass" className="text-xs font-medium text-zinc-500">
              Passing Marks
            </label>
            <input
              id="es-pass"
              type="number"
              min={0}
              value={passingMarks}
              onChange={(e) => setPassingMarks(e.target.value)}
              className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={isSubmitting || !classId || !subjectId}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Subject"}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Class</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Subject</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Max Marks</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Passing Marks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2 text-zinc-900">{row.className}</td>
                <td className="px-4 py-2 text-zinc-700">{row.subjectName}</td>
                <td className="px-4 py-2 text-right text-zinc-700">{row.maxMarks}</td>
                <td className="px-4 py-2 text-right text-zinc-700">{row.passingMarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No subjects configured yet.</p>}
      </div>
    </div>
  );
}
