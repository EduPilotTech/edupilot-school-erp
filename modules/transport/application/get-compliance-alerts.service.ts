import "server-only";
import { PrismaVehicleRepository } from "../infrastructure/prisma-vehicle.repository";
import { PrismaDriverRepository } from "../infrastructure/prisma-driver.repository";
import type { ComplianceAlertDTO, ComplianceAlertField } from "./dto/reports.dto";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function buildAlert(
  entityType: "VEHICLE" | "DRIVER",
  entityId: string,
  label: string,
  field: ComplianceAlertField,
  expiryDate: Date | null,
  asOf: Date,
  withinDays: number
): ComplianceAlertDTO | null {
  if (!expiryDate) return null;
  const daysRemaining = Math.ceil((expiryDate.getTime() - asOf.getTime()) / MS_PER_DAY);
  if (daysRemaining > withinDays) return null;
  return {
    entityType,
    entityId,
    label,
    field,
    expiryDate: expiryDate.toISOString().slice(0, 10),
    daysRemaining,
    isExpired: daysRemaining < 0,
  };
}

// Compliance alerts (Phase 10 requirement 12/9) — vehicles and drivers whose tracked expiry
// dates have already lapsed or fall within `withinDays` (default 30). Reads the plain expiry-date
// fields only (Decision 6 — no document/file upload subsystem this phase).
export async function getComplianceAlerts(tenantId: string, withinDays = 30): Promise<ComplianceAlertDTO[]> {
  const asOf = new Date();
  const alerts: ComplianceAlertDTO[] = [];

  const vehicleRepository = new PrismaVehicleRepository();
  const vehicles = await vehicleRepository.findMany(tenantId);
  for (const vehicle of vehicles) {
    const label = vehicle.registrationNumber;
    const checks: [ComplianceAlertField, Date | null][] = [
      ["INSURANCE", vehicle.insuranceExpiryDate],
      ["FITNESS", vehicle.fitnessExpiryDate],
      ["PERMIT", vehicle.permitExpiryDate],
      ["POLLUTION", vehicle.pollutionExpiryDate],
    ];
    for (const [field, expiryDate] of checks) {
      const alert = buildAlert("VEHICLE", vehicle.id, label, field, expiryDate, asOf, withinDays);
      if (alert) alerts.push(alert);
    }
  }

  const driverRepository = new PrismaDriverRepository();
  const drivers = await driverRepository.findMany(tenantId);
  for (const driver of drivers) {
    const alert = buildAlert("DRIVER", driver.id, driver.fullName, "LICENSE", driver.licenseExpiryDate, asOf, withinDays);
    if (alert) alerts.push(alert);
  }

  alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  return alerts;
}
