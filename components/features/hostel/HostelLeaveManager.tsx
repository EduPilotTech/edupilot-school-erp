"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  requestHostelLeaveAction,
  approveHostelLeaveAction,
  rejectHostelLeaveAction,
  cancelHostelLeaveAction,
  recordHostelLeaveReturnAction,
} from "@/app/hostel/actions";
import type { HostelLeaveRequestDTO } from "@/modules/hostel/application/dto/hostel-leave-request.dto";

interface StudentOption {
  id: string;
  admissionNumber: string;
  fullName: string;
}

interface HostelLeaveManagerProps {
  academicSessionId: string;
  items: HostelLeaveRequestDTO[];
  studentOptions: StudentOption[];
  canManage: boolean;
}

const LEAVE_TYPES = ["REGULAR", "EMERGENCY", "WEEKEND"];

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// Request / Approval Workflow / Return Date tracking, all on one page — a leave request's
// lifecycle is short enough (request -> decide -> optionally record return) that splitting it
// across separate screens would just add navigation, not clarity.
export function HostelLeaveManager({ academicSessionId, items, studentOptions, canManage }: HostelLeaveManagerProps) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(studentOptions[0]?.id ?? "");
  const [leaveType, setLeaveType] = useState("REGULAR");
  const [fromDate, setFromDate] = useState(todayIsoDate());
  const [toDate, setToDate] = useState(todayIsoDate());
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [returningId, setReturningId] = useState<string | null>(null);
  const [returnDate, setReturnDate] = useState(todayIsoDate());

  function studentName(id: string): string {
    return studentOptions.find((s) => s.id === id)?.fullName ?? id;
  }

  async function handleRequest() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await requestHostelLeaveAction({ studentId, academicSessionId, leaveType, fromDate, toDate, reason });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setReason("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleApprove(leaveId: string) {
    setBusyId(leaveId);
    setError(null);
    try {
      const result = await approveHostelLeaveAction(leaveId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(leaveId: string) {
    setBusyId(leaveId);
    setError(null);
    try {
      const result = await rejectHostelLeaveAction(leaveId, { rejectionReason });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setRejectingId(null);
      setRejectionReason("");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(leaveId: string) {
    setBusyId(leaveId);
    setError(null);
    try {
      const result = await cancelHostelLeaveAction(leaveId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRecordReturn(leaveId: string) {
    setBusyId(leaveId);
    setError(null);
    try {
      const result = await recordHostelLeaveReturnAction(leaveId, { actualReturnDate: returnDate });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setReturningId(null);
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
            <label htmlFor="leave-student" className="text-xs font-medium text-zinc-500">
              Student
            </label>
            <select
              id="leave-student"
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
            <label htmlFor="leave-type" className="text-xs font-medium text-zinc-500">
              Type
            </label>
            <select
              id="leave-type"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {LEAVE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="leave-from" className="text-xs font-medium text-zinc-500">
              From
            </label>
            <input
              id="leave-from"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="leave-to" className="text-xs font-medium text-zinc-500">
              To
            </label>
            <input
              id="leave-to"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="leave-reason" className="text-xs font-medium text-zinc-500">
              Reason
            </label>
            <input
              id="leave-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Family function"
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleRequest}
            disabled={isSubmitting || !studentId || !reason}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Student</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">From</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">To</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Returned</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((leave) => (
              <tr key={leave.id}>
                <td className="px-4 py-2 text-zinc-900">{studentName(leave.studentId)}</td>
                <td className="px-4 py-2 text-zinc-700">{leave.leaveType}</td>
                <td className="px-4 py-2 text-zinc-700">{leave.fromDate}</td>
                <td className="px-4 py-2 text-zinc-700">{leave.toDate}</td>
                <td className="px-4 py-2 text-zinc-700">{leave.status}</td>
                <td className="px-4 py-2 text-zinc-700">{leave.actualReturnDate ?? "—"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    {leave.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(leave.id)}
                          disabled={busyId === leave.id}
                          className="mr-3 text-sm text-emerald-600 hover:underline disabled:opacity-50"
                        >
                          Approve
                        </button>
                        {rejectingId === leave.id ? (
                          <span className="inline-flex items-center gap-2">
                            <input
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Reason"
                              className="w-32 rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleReject(leave.id)}
                              disabled={busyId === leave.id || !rejectionReason}
                              className="text-sm text-red-600 hover:underline disabled:opacity-50"
                            >
                              Confirm
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRejectingId(leave.id)}
                            disabled={busyId === leave.id}
                            className="mr-3 text-sm text-red-600 hover:underline disabled:opacity-50"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCancel(leave.id)}
                          disabled={busyId === leave.id}
                          className="ml-3 text-sm text-zinc-500 hover:underline disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {leave.status === "APPROVED" && !leave.actualReturnDate && (
                      returningId === leave.id ? (
                        <span className="inline-flex items-center gap-2">
                          <input
                            type="date"
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            className="rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleRecordReturn(leave.id)}
                            disabled={busyId === leave.id}
                            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                          >
                            Confirm
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReturningId(leave.id)}
                          disabled={busyId === leave.id}
                          className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                        >
                          Record Return
                        </button>
                      )
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No leave requests.</p>}
      </div>
    </div>
  );
}
