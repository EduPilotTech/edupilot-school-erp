import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaHelperRepository } from "../infrastructure/prisma-helper.repository";
import { HelperNotFoundError } from "../domain/errors";
import { updateHelperSchema, type HelperDTO } from "./dto/helper.dto";
import { toHelperDTO } from "./create-helper.service";
import type { TransportContext } from "./create-vehicle.service";

export async function updateHelper(helperId: string, input: unknown, context: TransportContext): Promise<HelperDTO> {
  const parsed = updateHelperSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid helper data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaHelperRepository();
  const existing = await repository.findById(tenantId, helperId);
  if (!existing || existing.deletedAt !== null) {
    throw new HelperNotFoundError();
  }

  const helper = await repository.update(tenantId, helperId, {
    fullName: data.fullName,
    phone: data.phone,
    address: data.address,
    dateOfJoining: data.dateOfJoining,
    isActive: data.isActive,
    updatedBy: actingUserId,
  });
  return toHelperDTO(helper);
}

export async function deleteHelper(helperId: string, context: TransportContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaHelperRepository();
  const existing = await repository.findById(tenantId, helperId);
  if (!existing || existing.deletedAt !== null) {
    throw new HelperNotFoundError();
  }
  await repository.softDelete(tenantId, helperId, actingUserId);
}
