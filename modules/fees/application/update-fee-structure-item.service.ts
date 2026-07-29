import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaFeeStructureItemRepository } from "../infrastructure/prisma-fee-structure-item.repository";
import { FeeStructureItemNotFoundError } from "../domain/errors";
import { updateFeeStructureItemSchema, type FeeStructureItemDTO } from "./dto/fee-structure.dto";
import { toFeeStructureItemDTO } from "./add-fee-structure-item.service";

export interface UpdateFeeStructureItemContext {
  tenantId: string;
  actingUserId: string;
}

export async function updateFeeStructureItem(
  itemId: string,
  input: unknown,
  context: UpdateFeeStructureItemContext
): Promise<FeeStructureItemDTO> {
  const parsed = updateFeeStructureItemSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid fee structure item data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaFeeStructureItemRepository();
  const existing = await repository.findById(tenantId, itemId);
  if (!existing || existing.deletedAt !== null) {
    throw new FeeStructureItemNotFoundError();
  }

  const item = await repository.update(tenantId, itemId, {
    amount: data.amount,
    frequency: data.frequency,
    dueDayOfMonth: data.dueDayOfMonth,
    isActive: data.isActive,
    updatedBy: actingUserId,
  });
  return toFeeStructureItemDTO(item);
}

export async function deleteFeeStructureItem(itemId: string, context: UpdateFeeStructureItemContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaFeeStructureItemRepository();
  const existing = await repository.findById(tenantId, itemId);
  if (!existing || existing.deletedAt !== null) {
    throw new FeeStructureItemNotFoundError();
  }
  await repository.softDelete(tenantId, itemId, actingUserId);
}
