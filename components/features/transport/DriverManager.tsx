"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDriverAction, updateDriverAction, deleteDriverAction } from "@/app/transport/actions";
import type { DriverDTO } from "@/modules/transport/application/dto/driver.dto";

interface DriverManagerProps {
  items: DriverDTO[];
  canManage: boolean;
}

// Driver is master data — no portal login this phase (Decision 3), so there is no
// userProfile-linking step here, unlike Guardian's GuardianLinkManager.
export function DriverManager({ items, canManage }: DriverManagerProps) {
  const router = useRouter();
  const [employeeCode, setEmployeeCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createDriverAction({
        employeeCode,
        fullName,
        phone: phone || undefined,
        licenseNumber,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setEmployeeCode("");
      setFullName("");
      setPhone("");
      setLicenseNumber("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(driver: DriverDTO) {
    setEditingId(driver.id);
    setError(null);
    try {
      const result = await updateDriverAction(driver.id, { isActive: !driver.isActive });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(driver: DriverDTO) {
    setEditingId(driver.id);
    setError(null);
    try {
      const result = await deleteDriverAction(driver.id);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="driver-code" className="text-xs font-medium text-zinc-500">
              Employee Code
            </label>
            <input
              id="driver-code"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              placeholder="DRV-001"
              className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="driver-name" className="text-xs font-medium text-zinc-500">
              Full Name
            </label>
            <input
              id="driver-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="driver-phone" className="text-xs font-medium text-zinc-500">
              Phone
            </label>
            <input
              id="driver-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-32 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="driver-license" className="text-xs font-medium text-zinc-500">
              License Number
            </label>
            <input
              id="driver-license"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className="w-40 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !employeeCode || !fullName || !licenseNumber}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Driver"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Code</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Phone</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">License</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((driver) => (
              <tr key={driver.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">{driver.employeeCode}</td>
                <td className="px-4 py-2 text-zinc-700">{driver.fullName}</td>
                <td className="px-4 py-2 text-zinc-700">{driver.phone ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{driver.licenseNumber}</td>
                <td className="px-4 py-2 text-zinc-700">{driver.isActive ? "Active" : "Inactive"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(driver)}
                      disabled={editingId === driver.id}
                      className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {driver.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(driver)}
                      disabled={editingId === driver.id}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No drivers yet.</p>}
      </div>
    </div>
  );
}
