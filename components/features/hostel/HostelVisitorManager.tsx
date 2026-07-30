"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logHostelVisitorAction, recordHostelVisitorExitAction } from "@/app/hostel/actions";
import type { HostelVisitorReportRowDTO } from "@/modules/hostel/application/dto/reports.dto";

interface StudentOption {
  id: string;
  admissionNumber: string;
  fullName: string;
}

interface HostelVisitorManagerProps {
  items: HostelVisitorReportRowDTO[];
  studentOptions: StudentOption[];
  canManage: boolean;
}

export function HostelVisitorManager({ items, studentOptions, canManage }: HostelVisitorManagerProps) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(studentOptions[0]?.id ?? "");
  const [visitorName, setVisitorName] = useState("");
  const [relation, setRelation] = useState("");
  const [purpose, setPurpose] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleLogEntry() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await logHostelVisitorAction({
        studentId,
        visitorName,
        relation,
        purpose,
        entryTime: new Date().toISOString(),
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setVisitorName("");
      setRelation("");
      setPurpose("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRecordExit(visitorId: string) {
    setBusyId(visitorId);
    setError(null);
    try {
      const result = await recordHostelVisitorExitAction(visitorId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="visitor-student" className="text-xs font-medium text-zinc-500">
              Student
            </label>
            <select
              id="visitor-student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {studentOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.admissionNumber})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="visitor-name" className="text-xs font-medium text-zinc-500">
              Visitor Name
            </label>
            <input
              id="visitor-name"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              className="w-40 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="visitor-relation" className="text-xs font-medium text-zinc-500">
              Relation
            </label>
            <input
              id="visitor-relation"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="Father"
              className="w-32 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="visitor-purpose" className="text-xs font-medium text-zinc-500">
              Purpose
            </label>
            <input
              id="visitor-purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="General visit"
              className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleLogEntry}
            disabled={isSubmitting || !studentId || !visitorName || !relation || !purpose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Logging…" : "Log Entry"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Student</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Visitor</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Relation</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Purpose</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Entry</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Exit</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((visitor) => (
              <tr key={visitor.id}>
                <td className="px-4 py-2 text-zinc-900">{visitor.studentName}</td>
                <td className="px-4 py-2 text-zinc-700">{visitor.visitorName}</td>
                <td className="px-4 py-2 text-zinc-700">{visitor.relation}</td>
                <td className="px-4 py-2 text-zinc-700">{visitor.purpose}</td>
                <td className="px-4 py-2 text-zinc-700">{new Date(visitor.entryTime).toLocaleString()}</td>
                <td className="px-4 py-2 text-zinc-700">
                  {visitor.exitTime ? new Date(visitor.exitTime).toLocaleString() : "—"}
                </td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    {!visitor.exitTime && (
                      <button
                        type="button"
                        onClick={() => handleRecordExit(visitor.id)}
                        disabled={busyId === visitor.id}
                        className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                      >
                        Record Exit
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No visitors logged yet.</p>}
      </div>
    </div>
  );
}
