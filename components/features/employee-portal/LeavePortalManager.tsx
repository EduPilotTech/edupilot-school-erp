"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { applyForMyLeaveAction, cancelMyLeaveRequestAction } from "@/app/employee-portal/actions";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import type { EmployeeLeaveRequestDTO } from "@/modules/hr/application/dto/leave.dto";

interface LeaveTypeOption {
  id: string;
  name: string;
}

interface LeavePortalManagerProps {
  history: EmployeeLeaveRequestDTO[];
  leaveTypeOptions: LeaveTypeOption[];
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// Self-service "Apply for Leave" + "Leave History" — the employee-facing counterpart to
// components/features/hr/LeaveRequestManager.tsx's HR-manager approval console. This component
// never sends `employeeId` anywhere: applyForMyLeaveAction/cancelMyLeaveRequestAction both
// resolve it server-side from the caller's own session, so there is no such field on this form.
// The Cancel button is shown for PENDING or APPROVED requests (a future-dated APPROVED leave is
// cancellable, a past one is not) — the server enforces the actual business rule and any
// resulting error surfaces inline, this is just when the button is offered.
export function LeavePortalManager({ history, leaveTypeOptions }: LeavePortalManagerProps) {
  const router = useRouter();

  const [leaveTypeId, setLeaveTypeId] = useState(leaveTypeOptions[0]?.id ?? "");
  const [fromDate, setFromDate] = useState(todayIsoDate());
  const [toDate, setToDate] = useState(todayIsoDate());
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  function leaveTypeName(id: string): string {
    return leaveTypeOptions.find((lt) => lt.id === id)?.name ?? id;
  }

  async function handleApply() {
    setIsSubmitting(true);
    setApplyError(null);
    setApplyMessage(null);
    try {
      const result = await applyForMyLeaveAction({
        leaveTypeId,
        fromDate,
        toDate,
        isHalfDay,
        reason,
      });
      if (!result.success) {
        setApplyError(result.error.message);
        return;
      }
      setApplyMessage(`Leave request submitted for ${leaveTypeName(leaveTypeId)}.`);
      setReason("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(leaveId: string) {
    setBusyId(leaveId);
    setHistoryError(null);
    try {
      const result = await cancelMyLeaveRequestAction(leaveId);
      if (!result.success) {
        setHistoryError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Apply for Leave" description="Submit a new leave request for approval.">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Leave Type" htmlFor="apply-leave-type">
              <Select
                id="apply-leave-type"
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
                options={leaveTypeOptions.map((lt) => ({ value: lt.id, label: lt.name }))}
              />
            </FormField>
            <FormField label="From Date" htmlFor="apply-from-date">
              <Input id="apply-from-date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </FormField>
            <FormField label="To Date" htmlFor="apply-to-date">
              <Input id="apply-to-date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </FormField>
          </div>

          <Checkbox
            id="apply-half-day"
            label="Half day"
            checked={isHalfDay}
            onChange={(e) => setIsHalfDay(e.target.checked)}
          />

          <FormField label="Reason" htmlFor="apply-reason">
            <Textarea id="apply-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
          </FormField>

          {applyError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{applyError}</p>}
          {applyMessage && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{applyMessage}</p>
          )}

          <div>
            <button
              type="button"
              onClick={handleApply}
              disabled={isSubmitting || !leaveTypeId || !fromDate || !toDate || !reason.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </div>
      </Card>

      <Card title="Leave History">
        {historyError && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{historyError}</p>
        )}
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Leave Type</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">From</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">To</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Days</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Reason</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {history.map((leave) => (
                <tr key={leave.id}>
                  <td className="px-4 py-2 text-zinc-900">{leaveTypeName(leave.leaveTypeId)}</td>
                  <td className="px-4 py-2 text-zinc-700">{leave.fromDate}</td>
                  <td className="px-4 py-2 text-zinc-700">{leave.toDate}</td>
                  <td className="px-4 py-2 text-zinc-700">
                    {leave.totalDays}
                    {leave.isHalfDay ? " (half day)" : ""}
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-2 text-zinc-700" title={leave.reason}>
                    {leave.reason}
                  </td>
                  <td className="px-4 py-2 text-zinc-700">
                    {leave.status}
                    {leave.status === "REJECTED" && leave.rejectionReason && (
                      <span className="block text-xs text-zinc-400" title={leave.rejectionReason}>
                        {leave.rejectionReason}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {(leave.status === "PENDING" || leave.status === "APPROVED") && (
                      <button
                        type="button"
                        onClick={() => handleCancel(leave.id)}
                        disabled={busyId === leave.id}
                        className="text-sm text-zinc-500 hover:underline disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && <p className="p-4 text-sm text-zinc-500">No leave requests yet.</p>}
        </div>
      </Card>
    </div>
  );
}
