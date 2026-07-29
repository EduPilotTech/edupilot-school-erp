"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createVehicleAction, updateVehicleAction, deleteVehicleAction } from "@/app/transport/actions";
import type { VehicleDTO } from "@/modules/transport/application/dto/vehicle.dto";

interface VehicleManagerProps {
  items: VehicleDTO[];
  canManage: boolean;
}

const VEHICLE_TYPES = ["BUS", "MINI_BUS", "VAN", "OTHER"];
const FUEL_TYPES = ["DIESEL", "PETROL", "CNG", "ELECTRIC", "OTHER"];
const STATUSES = ["ACTIVE", "MAINTENANCE", "BREAKDOWN", "INACTIVE"];

// Vehicle is fleet master data — same one-inline-form-plus-table shape as FeeCategoryManager.
// Status is a lifecycle select (Decision 7), not a boolean toggle.
export function VehicleManager({ items, canManage }: VehicleManagerProps) {
  const router = useRouter();
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("BUS");
  const [seatingCapacity, setSeatingCapacity] = useState("40");
  const [fuelType, setFuelType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createVehicleAction({
        registrationNumber,
        vehicleType,
        seatingCapacity: Number(seatingCapacity),
        fuelType: fuelType || undefined,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setRegistrationNumber("");
      setSeatingCapacity("40");
      setFuelType("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(vehicle: VehicleDTO, status: string) {
    setEditingId(vehicle.id);
    setError(null);
    try {
      const result = await updateVehicleAction(vehicle.id, { status });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(vehicle: VehicleDTO) {
    setEditingId(vehicle.id);
    setError(null);
    try {
      const result = await deleteVehicleAction(vehicle.id);
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
            <label htmlFor="vehicle-reg" className="text-xs font-medium text-zinc-500">
              Registration Number
            </label>
            <input
              id="vehicle-reg"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="KA-01-AB-1234"
              className="w-40 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="vehicle-type" className="text-xs font-medium text-zinc-500">
              Type
            </label>
            <select
              id="vehicle-type"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="vehicle-capacity" className="text-xs font-medium text-zinc-500">
              Seating Capacity
            </label>
            <input
              id="vehicle-capacity"
              type="number"
              min={1}
              value={seatingCapacity}
              onChange={(e) => setSeatingCapacity(e.target.value)}
              className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="vehicle-fuel" className="text-xs font-medium text-zinc-500">
              Fuel Type
            </label>
            <select
              id="vehicle-fuel"
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              <option value="">—</option>
              {FUEL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !registrationNumber || !seatingCapacity}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Vehicle"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Registration</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Capacity</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Fuel</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((vehicle) => (
              <tr key={vehicle.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">{vehicle.registrationNumber}</td>
                <td className="px-4 py-2 text-zinc-700">{vehicle.vehicleType.replace("_", " ")}</td>
                <td className="px-4 py-2 text-zinc-700">{vehicle.seatingCapacity}</td>
                <td className="px-4 py-2 text-zinc-700">{vehicle.fuelType ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">
                  {canManage ? (
                    <select
                      value={vehicle.status}
                      disabled={editingId === vehicle.id}
                      onChange={(e) => handleStatusChange(vehicle, e.target.value)}
                      className="rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  ) : (
                    vehicle.status
                  )}
                </td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(vehicle)}
                      disabled={editingId === vehicle.id}
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
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No vehicles yet.</p>}
      </div>
    </div>
  );
}
