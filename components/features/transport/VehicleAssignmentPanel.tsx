"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignVehicleToRouteAction } from "@/app/transport/actions";
import type { VehicleAssignmentDTO } from "@/modules/transport/application/dto/vehicle-assignment.dto";
import type { VehicleDTO } from "@/modules/transport/application/dto/vehicle.dto";
import type { DriverDTO } from "@/modules/transport/application/dto/driver.dto";
import type { HelperDTO } from "@/modules/transport/application/dto/helper.dto";

interface VehicleAssignmentPanelProps {
  routeId: string;
  academicSessionId: string;
  current: VehicleAssignmentDTO | null;
  vehicles: VehicleDTO[];
  drivers: DriverDTO[];
  helpers: HelperDTO[];
  canManage: boolean;
}

// Decision 2: a 1:1 Route<->Vehicle<->Driver(+Helper) mapping per session — one form, no history
// list, since reassigning updates the same VehicleAssignment row.
export function VehicleAssignmentPanel({
  routeId,
  academicSessionId,
  current,
  vehicles,
  drivers,
  helpers,
  canManage,
}: VehicleAssignmentPanelProps) {
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState(current?.vehicleId ?? "");
  const [driverId, setDriverId] = useState(current?.driverId ?? "");
  const [helperId, setHelperId] = useState(current?.helperId ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await assignVehicleToRouteAction({
        routeId,
        academicSessionId,
        vehicleId,
        driverId,
        helperId: helperId || undefined,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!canManage) {
    return current ? (
      <p className="text-sm text-zinc-700">
        Vehicle {vehicles.find((v) => v.id === current.vehicleId)?.registrationNumber ?? current.vehicleId}, driver{" "}
        {drivers.find((d) => d.id === current.driverId)?.fullName ?? current.driverId}.
      </p>
    ) : (
      <p className="text-sm text-zinc-500">No vehicle assigned this session.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="assign-vehicle" className="text-xs font-medium text-zinc-500">
            Vehicle
          </label>
          <select
            id="assign-vehicle"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select vehicle…</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.registrationNumber}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="assign-driver" className="text-xs font-medium text-zinc-500">
            Driver
          </label>
          <select
            id="assign-driver"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select driver…</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.fullName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="assign-helper" className="text-xs font-medium text-zinc-500">
            Helper (optional)
          </label>
          <select
            id="assign-helper"
            value={helperId}
            onChange={(e) => setHelperId(e.target.value)}
            className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">—</option>
            {helpers.map((helper) => (
              <option key={helper.id} value={helper.id}>
                {helper.fullName}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleAssign}
          disabled={isSubmitting || !vehicleId || !driverId}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : current ? "Update Assignment" : "Assign"}
        </button>
      </div>
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
