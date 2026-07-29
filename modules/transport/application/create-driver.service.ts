import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaDriverRepository } from "../infrastructure/prisma-driver.repository";
import { DriverAlreadyExistsError } from "../domain/errors";
import { createDriverSchema, type DriverDTO } from "./dto/driver.dto";
import type { DriverEntity } from "../domain/driver.entity";
import type { TransportContext } from "./create-vehicle.service";

function toDTO(entity: DriverEntity): DriverDTO {
  return {
    id: entity.id,
    userProfileId: entity.userProfileId,
    employeeCode: entity.employeeCode,
    fullName: entity.fullName,
    phone: entity.phone,
    address: entity.address,
    licenseNumber: entity.licenseNumber,
    licenseType: entity.licenseType,
    licenseExpiryDate: entity.licenseExpiryDate ? entity.licenseExpiryDate.toISOString().slice(0, 10) : null,
    dateOfJoining: entity.dateOfJoining ? entity.dateOfJoining.toISOString().slice(0, 10) : null,
    isActive: entity.isActive,
  };
}

export async function createDriver(input: unknown, context: TransportContext): Promise<DriverDTO> {
  const parsed = createDriverSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid driver data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaDriverRepository();
  const existing = await repository.findByEmployeeCode(tenantId, data.employeeCode);
  if (existing) {
    throw new DriverAlreadyExistsError();
  }

  try {
    const driver = await repository.create({
      tenantId,
      employeeCode: data.employeeCode,
      fullName: data.fullName,
      phone: data.phone ?? null,
      address: data.address ?? null,
      licenseNumber: data.licenseNumber,
      licenseType: data.licenseType ?? null,
      licenseExpiryDate: data.licenseExpiryDate ?? null,
      dateOfJoining: data.dateOfJoining ?? null,
      createdBy: actingUserId,
    });
    return toDTO(driver);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DriverAlreadyExistsError();
    }
    throw error;
  }
}

export { toDTO as toDriverDTO };
