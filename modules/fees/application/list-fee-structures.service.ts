import "server-only";
import { PrismaFeeStructureRepository } from "../infrastructure/prisma-fee-structure.repository";
import { toFeeStructureDTO } from "./create-fee-structure.service";
import type { FeeStructureDTO } from "./dto/fee-structure.dto";

export async function listFeeStructures(tenantId: string, academicSessionId: string): Promise<FeeStructureDTO[]> {
  const repository = new PrismaFeeStructureRepository();
  const structures = await repository.findByAcademicSession(tenantId, academicSessionId);
  return structures.map(toFeeStructureDTO);
}
