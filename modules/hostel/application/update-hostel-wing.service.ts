import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaHostelWingRepository } from "../infrastructure/prisma-hostel-wing.repository";
import { HostelWingNotFoundError } from "../domain/errors";
import { updateHostelWingSchema, type HostelWingDTO } from "./dto/hostel-structure.dto";
import { toHostelWingDTO } from "./create-hostel-wing.service";
import type { HostelContext } from "./create-hostel.service";

export async function updateHostelWing(wingId: string, input: unknown, context: HostelContext): Promise<HostelWingDTO> {
  const parsed = updateHostelWingSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid wing data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaHostelWingRepository();
  const existing = await repository.findById(tenantId, wingId);
  if (!existing || existing.deletedAt !== null) {
    throw new HostelWingNotFoundError();
  }

  const wing = await repository.update(tenantId, wingId, {
    name: data.name,
    isActive: data.isActive,
    updatedBy: actingUserId,
  });
  return toHostelWingDTO(wing);
}

export async function deleteHostelWing(wingId: string, context: HostelContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaHostelWingRepository();
  const existing = await repository.findById(tenantId, wingId);
  if (!existing || existing.deletedAt !== null) {
    throw new HostelWingNotFoundError();
  }
  await repository.softDelete(tenantId, wingId, actingUserId);
}
