"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markTeacherAttendanceAction } from "@/app/attendance/actions";
import { ATTENDANCE_STATUS_OPTIONS } from "@/components/features/attendance/attendance.types";

export interface StaffAttendanceRow {
  userProfileId: string;
  fullName: string;
  employeeCode: string;
  status: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  remarks: string | null;
}

interface StaffAttendanceMarkerProps {
  date: string;
  rows: StaffAttendanceRow[];
}

interface RowState {
  status: string;
  checkInTime: string;
  checkOutTime: string;
  remarks: string;
}

// Per-row save (not a single bulk submit) — staff attendance has no bulk-mark Server Action,
// unlike student attendance's bulkMarkAttendanceAction. Each row calls the EXISTING
// markTeacherAttendanceAction from app/attendance/actions.ts directly, matching Phase 13's
// checkInTime/checkOutTime extension to that action.
export function StaffAttendanceMarker({ date, rows }: StaffAttendanceMarkerProps) {
  const router = useRouter();
  const [state, setState] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      rows.map((row) => [
        row.userProfileId,
        {
          status: row.status ?? "PRESENT",
          checkInTime: row.checkInTime ?? "",
          checkOutTime: row.checkOutTime ?? "",
          remarks: row.remarks ?? "",
        },
      ])
    )
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  function updateRow(userProfileId: string, patch: Partial<RowState>) {
    setState((prev) => ({ ...prev, [userProfileId]: { ...prev[userProfileId], ...patch } }));
    setSavedId(null);
  }

  async function handleSave(userProfileId: string) {
    const row = state[userProfileId];
    setSavingId(userProfileId);
    setRowError(null);
    setSavedId(null);
    try {
      const result = await markTeacherAttendanceAction({
        userProfileId,
        date,
        status: row.status,
        remarks: row.remarks || undefined,
        checkInTime: row.checkInTime || undefined,
        checkOutTime: row.checkOutTime || undefined,
      });
      if (!result.success) {
        setRowError({ id: userProfileId, message: result.error.message });
        return;
      }
      setSavedId(userProfileId);
      router.refresh();
    } finally {
      setSavingId(null);
    }
  }

  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">No active staff members found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Employee</th>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Check-In</th>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Check-Out</th>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Remarks</th>
            <th className="px-4 py-2 text-right font-medium text-zinc-500">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {rows.map((row) => {
            const rowState = state[row.userProfileId];
            return (
              <tr key={row.userProfileId}>
                <td className="px-4 py-2 text-zinc-900">
                  {row.fullName} <span className="text-xs text-zinc-400">({row.employeeCode})</span>
                </td>
                <td className="px-4 py-2">
                  <select
                    value={rowState.status}
                    onChange={(e) => updateRow(row.userProfileId, { status: e.target.value })}
                    className="rounded-lg border border-zinc-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="time"
                    value={rowState.checkInTime}
                    onChange={(e) => updateRow(row.userProfileId, { checkInTime: e.target.value })}
                    className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="time"
                    value={rowState.checkOutTime}
                    onChange={(e) => updateRow(row.userProfileId, { checkOutTime: e.target.value })}
                    className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    value={rowState.remarks}
                    onChange={(e) => updateRow(row.userProfileId, { remarks: e.target.value })}
                    placeholder="Optional"
                    className="w-32 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => handleSave(row.userProfileId)}
                    disabled={savingId === row.userProfileId}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingId === row.userProfileId ? "Saving…" : "Save"}
                  </button>
                  {savedId === row.userProfileId && <p className="mt-1 text-xs text-emerald-600">Saved</p>}
                  {rowError?.id === row.userProfileId && (
                    <p className="mt-1 text-xs text-red-600">{rowError.message}</p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
