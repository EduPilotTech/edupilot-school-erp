"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClassAction } from "@/app/academics/classes/actions";
import type { ClassDTO } from "@/modules/academics/application/dto/academic-class.dto";

interface SessionOption {
  id: string;
  sessionName: string;
}

interface ClassManagerProps {
  items: ClassDTO[];
  sessions: SessionOption[];
  canManage: boolean;
}

export function ClassManager({ items, sessions, canManage }: ClassManagerProps) {
  const router = useRouter();
  const [academicSessionId, setAcademicSessionId] = useState(sessions[0]?.id ?? "");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionNameById = new Map(sessions.map((s) => [s.id, s.sessionName]));

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createClassAction({
        academicSessionId,
        name,
        grade: grade ? Number(grade) : undefined,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setName("");
      setGrade("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          {sessions.length === 0 ? (
            <p className="text-sm text-zinc-500">Create an academic session first before adding classes.</p>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor="class-session" className="text-xs font-medium text-zinc-500">
                  Academic Session
                </label>
                <select
                  id="class-session"
                  value={academicSessionId}
                  onChange={(e) => setAcademicSessionId(e.target.value)}
                  className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                >
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.sessionName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="class-name" className="text-xs font-medium text-zinc-500">
                  Class Name
                </label>
                <input
                  id="class-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Class I"
                  className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="class-grade" className="text-xs font-medium text-zinc-500">
                  Grade (optional)
                </label>
                <input
                  id="class-grade"
                  type="number"
                  min={0}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="1"
                  className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isSubmitting || !name || !academicSessionId}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Adding…" : "Add Class"}
              </button>
            </>
          )}
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
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Grade</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Academic Session</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((classEntity) => (
              <tr key={classEntity.id}>
                <td className="px-4 py-2 text-zinc-900">{classEntity.name}</td>
                <td className="px-4 py-2 text-zinc-700">{classEntity.grade ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">
                  {sessionNameById.get(classEntity.academicSessionId) ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No classes yet.</p>}
      </div>
    </div>
  );
}
