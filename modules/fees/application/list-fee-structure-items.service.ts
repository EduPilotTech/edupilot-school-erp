import "server-only";
import { PrismaFeeStructureItemRepository } from "../infrastructure/prisma-fee-structure-item.repository";
import { toFeeStructureItemDTO } from "./add-fee-structure-item.service";
import type { FeeStructureItemDTO } from "./dto/fee-structure.dto";

export async function listFeeStructureItems(tenantId: string, feeStructureId: string): Promise<FeeStructureItemDTO[]> {
  const repository = new PrismaFeeStructureItemRepository();
  const items = await repository.findByStructure(tenantId, feeStructureId);
  return items.map(toFeeStructureItemDTO);
}
