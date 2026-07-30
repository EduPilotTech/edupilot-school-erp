import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaHostelRepository } from "../infrastructure/prisma-hostel.repository";
import { HostelAlreadyExistsError, HostelNotFoundError } from "../domain/errors";
import { updateHostelSchema, type HostelDTO } from "./dto/hostel.dto";
import { toHostelDTO } from "./create-hostel.service";
import type { HostelContext } from "./create-hostel.service";

export async function updateHostel(hostelId: string, input: unknown, context: HostelContext): Promise<HostelDTO> {
  const parsed = updateHostelSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid hostel data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaHostelRepository();
  const existing = await repository.findById(tenantId, hostelId);
  if (!existing || existing.deletedAt !== null) {
    throw new HostelNotFoundError();
  }

  try {
    const hostel = await repository.update(tenantId, hostelId, {
      name: data.name,
      code: data.code,
      type: data.type,
      address: data.address,
      isActive: data.isActive,
      updatedBy: actingUserId,
    });
    return toHostelDTO(hostel);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HostelAlreadyExistsError();
    }
    throw error;
  }
}

export async function deleteHostel(hostelId: string, context: HostelContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaHostelRepository();
  const existing = await repository.findById(tenantId, hostelId);
  if (!existing || existing.deletedAt !== null) {
    throw new HostelNotFoundError();
  }
  await repository.softDelete(tenantId, hostelId, actingUserId);
}
