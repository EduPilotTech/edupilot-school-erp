"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { returnBookAction, renewBookIssueAction, markBookLostAction, markBookDamagedAction } from "@/app/library/actions";
import type { CirculationRowDTO } from "@/modules/library/application/dto/reports.dto";

interface ReturnCounterProps {
  items: CirculationRowDTO[];
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReturnCounter({ items }: ReturnCounterProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReturn(issueId: string) {
    setBusyId(issueId);
    setError(null);
    try {
      const result = await returnBookAction(issueId, { returnDate: todayIsoDate() });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRenew(issueId: string) {
    setBusyId(issueId);
    setError(null);
    try {
      const result = await renewBookIssueAction(issueId, {});
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkLost(issueId: string) {
    setBusyId(issueId);
    setError(null);
    try {
      const result = await markBookLostAction(issueId, { reportedDate: todayIsoDate() });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkDamaged(issueId: string) {
    setBusyId(issueId);
    setError(null);
    try {
      const result = await markBookDamagedAction(issueId, { reportedDate: todayIsoDate() });
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
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Book</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Accession #</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Member</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Due Date</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((row) => (
              <tr key={row.bookIssueId}>
                <td className="px-4 py-2 font-medium text-zinc-900">{row.bookTitle}</td>
                <td className="px-4 py-2 text-zinc-700">{row.accessionNumber}</td>
                <td className="px-4 py-2 text-zinc-700">
                  {row.memberName} <span className="text-xs text-zinc-400">({row.memberType})</span>
                </td>
                <td className="px-4 py-2 text-zinc-700">{row.dueDate}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => handleReturn(row.bookIssueId)}
                    disabled={busyId === row.bookIssueId}
                    className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                  >
                    Return
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRenew(row.bookIssueId)}
                    disabled={busyId === row.bookIssueId}
                    className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                  >
                    Renew
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkLost(row.bookIssueId)}
                    disabled={busyId === row.bookIssueId}
                    className="mr-3 text-sm text-amber-600 hover:underline disabled:opacity-50"
                  >
                    Lost
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkDamaged(row.bookIssueId)}
                    disabled={busyId === row.bookIssueId}
                    className="text-sm text-red-600 hover:underline disabled:opacity-50"
                  >
                    Damaged
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No books currently issued.</p>}
      </div>
    </div>
  );
}
