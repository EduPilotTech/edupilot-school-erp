import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaHostelBedRepository } from "../infrastructure/prisma-hostel-bed.repository";
import { BedNotAvailableError, HostelBedNotFoundError } from "../domain/errors";
import { updateHostelBedSchema, type HostelBedDTO } from "./dto/hostel-structure.dto";
import { toHostelBedDTO } from "./create-hostel-bed.service";
import type { HostelContext } from "./create-hostel.service";

export async function updateHostelBed(bedId: string, input: unknown, context: HostelContext): Promise<HostelBedDTO> {
  const parsed = updateHostelBedSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid bed data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaHostelBedRepository();
  const existing = await repository.findById(tenantId, bedId);
  if (!existing || existing.deletedAt !== null) {
    throw new HostelBedNotFoundError();
  }

  try {
    const bed = await repository.update(tenantId, bedId, { bedNumber: data.bedNumber, updatedBy: actingUserId });
    return toHostelBedDTO(bed);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ValidationError("A bed with this number already exists in this room.");
    }
    throw error;
  }
}

// Sets a bed's status to MAINTENANCE or back to AVAILABLE — refuses to (re)enable a bed
// currently OCCUPIED, and refuses to take an OCCUPIED bed straight to MAINTENANCE without first
// checking the student out (see check-out-student-hostel.service.ts).
export async function setHostelBedMaintenance(
  bedId: string,
  underMaintenance: boolean,
  context: HostelContext
): Promise<HostelBedDTO> {
  const { tenantId } = context;
  const repository = new PrismaHostelBedRepository();
  const existing = await repository.findById(tenantId, bedId);
  if (!existing || existing.deletedAt !== null) {
    throw new HostelBedNotFoundError();
  }
  if (existing.status === "OCCUPIED") {
    throw new BedNotAvailableError();
  }

  const bed = await repository.setStatus(tenantId, bedId, underMaintenance ? "MAINTENANCE" : "AVAILABLE");
  return toHostelBedDTO(bed);
}

export async function deleteHostelBed(bedId: string, context: HostelContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaHostelBedRepository();
  const existing = await repository.findById(tenantId, bedId);
  if (!existing || existing.deletedAt !== null) {
    throw new HostelBedNotFoundError();
  }
  if (existing.status === "OCCUPIED") {
    throw new BedNotAvailableError();
  }
  await repository.softDelete(tenantId, bedId, actingUserId);
}
