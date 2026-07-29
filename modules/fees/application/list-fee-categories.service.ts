import "server-only";
import { PrismaFeeCategoryRepository } from "../infrastructure/prisma-fee-category.repository";
import { toFeeCategoryDTO } from "./create-fee-category.service";
import type { FeeCategoryDTO } from "./dto/fee-category.dto";

export async function listFeeCategories(context: { tenantId: string }): Promise<FeeCategoryDTO[]> {
  const repository = new PrismaFeeCategoryRepository();
  const categories = await repository.findMany(context.tenantId);
  return categories.map(toFeeCategoryDTO);
}
