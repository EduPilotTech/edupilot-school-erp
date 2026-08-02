"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { suspendSchoolAction, activateSchoolAction } from "@/app/billing/platform-actions";
import type { SchoolManagementRowDTO } from "@/modules/billing/application/school-management.service";
import { StatusBadge } from "./StatusBadge";

interface SchoolManagerProps {
  items: SchoolManagementRowDTO[];
}

// Suspend/Activate on Tenant.status. Suspend requires a reason (suspendSchoolSchema enforces a
// required, non-empty string server-side), so the reason input is only revealed inline for the
// row being suspended, mirroring HostelLeaveManager.tsx's own "reason" field shape — the "reject
// with reason" precedent this codebase already established, adapted here to a per-row reveal
// rather than a form field that's always visible, since this is a table of many rows, not a
// single request form.
export function SchoolManager({ items }: SchoolManagerProps) {
  const router = useRouter();
  const [pendingSuspendTenantId, setPendingSuspendTenantId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyTenantId, setBusyTenantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function beginSuspend(tenantId: string) {
    setError(null);
    setReason("");
    setPendingSuspendTenantId(tenantId);
  }

  function cancelSuspend() {
    setPendingSuspendTenantId(null);
    setReason("");
  }

  async function confirmSuspend(tenantId: string) {
    setBusyTenantId(tenantId);
    setError(null);
    try {
      const result = await suspendSchoolAction(tenantId, { reason });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setPendingSuspendTenantId(null);
      setReason("");
      router.refresh();
    } finally {
      setBusyTenantId(null);
    }
  }

  async function handleActivate(tenantId: string) {
    setBusyTenantId(tenantId);
    setError(null);
    try {
      const result = await activateSchoolAction(tenantId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setBusyTenantId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">School</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Slug</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Plan</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Subscription Status</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((school) => (
              <tr key={school.tenantId}>
                <td className="px-4 py-2 font-medium text-zinc-900">{school.name}</td>
                <td className="px-4 py-2 text-zinc-700">{school.slug}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={school.status} />
                </td>
                <td className="px-4 py-2 text-zinc-700">{school.subscriptionPlan}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={school.subscriptionStatus} />
                </td>
                <td className="px-4 py-2 text-right">
                  {school.status === "SUSPENDED" ? (
                    <button
                      type="button"
                      onClick={() => handleActivate(school.tenantId)}
                      disabled={busyTenantId === school.tenantId}
                      className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {busyTenantId === school.tenantId ? "Activating…" : "Activate"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => beginSuspend(school.tenantId)}
                      disabled={busyTenantId === school.tenantId}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      Suspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No schools yet.</p>}
      </div>

      {pendingSuspendTenantId && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="suspend-reason" className="text-xs font-medium text-zinc-500">
              Suspension Reason
            </label>
            <input
              id="suspend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Non-payment of dues"
              className="w-72 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => confirmSuspend(pendingSuspendTenantId)}
            disabled={busyTenantId === pendingSuspendTenantId || !reason.trim()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyTenantId === pendingSuspendTenantId ? "Suspending…" : "Confirm Suspend"}
          </button>
          <button
            type="button"
            onClick={cancelSuspend}
            disabled={busyTenantId === pendingSuspendTenantId}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
