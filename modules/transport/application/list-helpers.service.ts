import "server-only";
import { PrismaHelperRepository } from "../infrastructure/prisma-helper.repository";
import { toHelperDTO } from "./create-helper.service";
import type { HelperDTO } from "./dto/helper.dto";

export async function listHelpers(context: { tenantId: string }, filter?: { isActive?: boolean }): Promise<HelperDTO[]> {
  const repository = new PrismaHelperRepository();
  const helpers = await repository.findMany(context.tenantId, filter);
  return helpers.map(toHelperDTO);
}
