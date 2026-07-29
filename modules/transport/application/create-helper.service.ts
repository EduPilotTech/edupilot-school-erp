import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaHelperRepository } from "../infrastructure/prisma-helper.repository";
import { HelperAlreadyExistsError } from "../domain/errors";
import { createHelperSchema, type HelperDTO } from "./dto/helper.dto";
import type { HelperEntity } from "../domain/helper.entity";
import type { TransportContext } from "./create-vehicle.service";

function toDTO(entity: HelperEntity): HelperDTO {
  return {
    id: entity.id,
    userProfileId: entity.userProfileId,
    employeeCode: entity.employeeCode,
    fullName: entity.fullName,
    phone: entity.phone,
    address: entity.address,
    dateOfJoining: entity.dateOfJoining ? entity.dateOfJoining.toISOString().slice(0, 10) : null,
    isActive: entity.isActive,
  };
}

export async function createHelper(input: unknown, context: TransportContext): Promise<HelperDTO> {
  const parsed = createHelperSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid helper data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaHelperRepository();
  const existing = await repository.findByEmployeeCode(tenantId, data.employeeCode);
  if (existing) {
    throw new HelperAlreadyExistsError();
  }

  try {
    const helper = await repository.create({
      tenantId,
      employeeCode: data.employeeCode,
      fullName: data.fullName,
      phone: data.phone ?? null,
      address: data.address ?? null,
      dateOfJoining: data.dateOfJoining ?? null,
      createdBy: actingUserId,
    });
    return toDTO(helper);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HelperAlreadyExistsError();
    }
    throw error;
  }
}

export { toDTO as toHelperDTO };
