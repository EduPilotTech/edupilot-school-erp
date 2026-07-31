"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveLeaveRequestAction,
  rejectLeaveRequestAction,
  cancelLeaveRequestAction,
  allocateLeaveBalanceAction,
} from "@/app/hr/actions";
import type { EmployeeLeaveRequestDTO } from "@/modules/hr/application/dto/leave.dto";

interface EmployeeOption {
  id: string;
  fullName: string;
  employeeCode: string;
}

interface LeaveTypeOption {
  id: string;
  name: string;
}

interface LeaveRequestManagerProps {
  items: EmployeeLeaveRequestDTO[];
  employeeOptions: EmployeeOption[];
  leaveTypeOptions: LeaveTypeOption[];
  canManage: boolean;
}

function currentYear(): number {
  return new Date().getFullYear();
}

// HR-manager approval console — mirrors components/features/hostel/HostelLeaveManager.tsx's
// reject-with-inline-reason pattern exactly. No "apply for leave" form here (that's staff-
// initiated from the Employee Portal, built separately); this component only decides on
// already-submitted requests and allocates yearly leave balances.
export function LeaveRequestManager({ items, employeeOptions, leaveTypeOptions, canManage }: LeaveRequestManagerProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [allocEmployeeId, setAllocEmployeeId] = useState(employeeOptions[0]?.id ?? "");
  const [allocLeaveTypeId, setAllocLeaveTypeId] = useState(leaveTypeOptions[0]?.id ?? "");
  const [allocYear, setAllocYear] = useState(String(currentYear()));
  const [allocDays, setAllocDays] = useState("");
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocError, setAllocError] = useState<string | null>(null);
  const [allocMessage, setAllocMessage] = useState<string | null>(null);

  function employeeName(id: string): string {
    const option = employeeOptions.find((e) => e.id === id);
    return option ? `${option.fullName} (${option.employeeCode})` : id;
  }

  function leaveTypeName(id: string): string {
    return leaveTypeOptions.find((lt) => lt.id === id)?.name ?? id;
  }

  async function handleApprove(leaveId: string) {
    setBusyId(leaveId);
    setError(null);
    try {
      const result = await approveLeaveRequestAction(leaveId);
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
      const result = await rejectLeaveRequestAction(leaveId, { rejectionReason });
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
      const result = await cancelLeaveRequestAction(leaveId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleAllocate() {
    setIsAllocating(true);
    setAllocError(null);
    setAllocMessage(null);
    try {
      const result = await allocateLeaveBalanceAction({
        employeeId: allocEmployeeId,
        leaveTypeId: allocLeaveTypeId,
        year: Number(allocYear),
        allocatedDays: Number(allocDays),
      });
      if (!result.success) {
        setAllocError(result.error.message);
        return;
      }
      setAllocMessage(
        `Allocated ${result.data.allocatedDays} day(s) of ${leaveTypeName(allocLeaveTypeId)} to ${employeeName(allocEmployeeId)} for ${allocYear}.`
      );
      setAllocDays("");
      router.refresh();
    } finally {
      setIsAllocating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Allocate Leave Balance</h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="alloc-employee" className="text-xs font-medium text-zinc-500">
                Employee
              </label>
              <select
                id="alloc-employee"
                value={allocEmployeeId}
                onChange={(e) => setAllocEmployeeId(e.target.value)}
                className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              >
                {employeeOptions.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName} ({employee.employeeCode})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="alloc-leave-type" className="text-xs font-medium text-zinc-500">
                Leave Type
              </label>
              <select
                id="alloc-leave-type"
                value={allocLeaveTypeId}
                onChange={(e) => setAllocLeaveTypeId(e.target.value)}
                className="w-44 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              >
                {leaveTypeOptions.map((leaveType) => (
                  <option key={leaveType.id} value={leaveType.id}>
                    {leaveType.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="alloc-year" className="text-xs font-medium text-zinc-500">
                Year
              </label>
              <input
                id="alloc-year"
                type="number"
                value={allocYear}
                onChange={(e) => setAllocYear(e.target.value)}
                className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="alloc-days" className="text-xs font-medium text-zinc-500">
                Allocated Days
              </label>
              <input
                id="alloc-days"
                type="number"
                min={0}
                value={allocDays}
                onChange={(e) => setAllocDays(e.target.value)}
                placeholder="12"
                className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleAllocate}
              disabled={isAllocating || !allocEmployeeId || !allocLeaveTypeId || !allocYear || !allocDays}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAllocating ? "Allocating…" : "Allocate"}
            </button>
          </div>
          {allocMessage && (
            <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
              {allocMessage}
            </p>
          )}
          {allocError && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{allocError}</p>
          )}
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Employee</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Leave Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">From</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">To</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Days</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Reason</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((leave) => (
              <tr key={leave.id}>
                <td className="px-4 py-2 text-zinc-900">{employeeName(leave.employeeId)}</td>
                <td className="px-4 py-2 text-zinc-700">{leaveTypeName(leave.leaveTypeId)}</td>
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
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingId(null);
                                setRejectionReason("");
                              }}
                              disabled={busyId === leave.id}
                              className="text-sm text-zinc-500 hover:underline disabled:opacity-50"
                            >
                              Cancel
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
                      </>
                    )}
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
