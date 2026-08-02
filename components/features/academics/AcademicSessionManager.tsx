"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAcademicSessionAction } from "@/app/academics/sessions/actions";
import type { AcademicSessionDTO } from "@/modules/academics/application/dto/academic-session.dto";

interface AcademicSessionManagerProps {
  items: AcademicSessionDTO[];
  canManage: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

export function AcademicSessionManager({ items, canManage }: AcademicSessionManagerProps) {
  const router = useRouter();
  const [sessionName, setSessionName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createAcademicSessionAction({ sessionName, startDate, endDate });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setSessionName("");
      setStartDate("");
      setEndDate("");
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
            <label htmlFor="session-name" className="text-xs font-medium text-zinc-500">
              Session Name
            </label>
            <input
              id="session-name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="2026-2027"
              className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="session-start" className="text-xs font-medium text-zinc-500">
              Start Date
            </label>
            <input
              id="session-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="session-end" className="text-xs font-medium text-zinc-500">
              End Date
            </label>
            <input
              id="session-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !sessionName || !startDate || !endDate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Academic Session"}
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
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Session</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Start Date</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">End Date</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((session) => (
              <tr key={session.id}>
                <td className="px-4 py-2 text-zinc-900">
                  {session.sessionName}
                  {session.isCurrent && (
                    <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                      Current
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-zinc-700">{formatDate(session.startDate)}</td>
                <td className="px-4 py-2 text-zinc-700">{formatDate(session.endDate)}</td>
                <td className="px-4 py-2 text-zinc-700">{session.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No academic sessions yet.</p>}
      </div>
    </div>
  );
}
