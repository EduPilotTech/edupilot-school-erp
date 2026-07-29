import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaDriverRepository } from "../infrastructure/prisma-driver.repository";
import { DriverNotFoundError } from "../domain/errors";
import { updateDriverSchema, type DriverDTO } from "./dto/driver.dto";
import { toDriverDTO } from "./create-driver.service";
import type { TransportContext } from "./create-vehicle.service";

export async function updateDriver(driverId: string, input: unknown, context: TransportContext): Promise<DriverDTO> {
  const parsed = updateDriverSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid driver data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaDriverRepository();
  const existing = await repository.findById(tenantId, driverId);
  if (!existing || existing.deletedAt !== null) {
    throw new DriverNotFoundError();
  }

  const driver = await repository.update(tenantId, driverId, {
    fullName: data.fullName,
    phone: data.phone,
    address: data.address,
    licenseNumber: data.licenseNumber,
    licenseType: data.licenseType,
    licenseExpiryDate: data.licenseExpiryDate,
    dateOfJoining: data.dateOfJoining,
    isActive: data.isActive,
    updatedBy: actingUserId,
  });
  return toDriverDTO(driver);
}

export async function deleteDriver(driverId: string, context: TransportContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaDriverRepository();
  const existing = await repository.findById(tenantId, driverId);
  if (!existing || existing.deletedAt !== null) {
    throw new DriverNotFoundError();
  }
  await repository.softDelete(tenantId, driverId, actingUserId);
}
