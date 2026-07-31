import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaSalaryStructureRepository } from "../infrastructure/prisma-salary-structure.repository";
import { PrismaSalaryComponentRepository } from "../infrastructure/prisma-salary-component.repository";
import { SalaryStructureAlreadyExistsError, SalaryStructureNotFoundError } from "../domain/errors";
import {
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  type SalaryStructureDTO,
  type SalaryStructureWithComponentsDTO,
} from "./dto/salary-structure.dto";
import type { SalaryStructureEntity } from "../domain/salary-structure.entity";
import type { PayrollContext } from "./payroll-context";
import { toSalaryComponentDTO } from "./salary-component.service";

function toDTO(entity: SalaryStructureEntity): SalaryStructureDTO {
  return {
    id: entity.id,
    schoolId: entity.schoolId,
    name: entity.name,
    isActive: entity.isActive,
  };
}

export async function createSalaryStructure(input: unknown, context: PayrollContext): Promise<SalaryStructureDTO> {
  const parsed = createSalaryStructureSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid salary structure data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaSalaryStructureRepository();
  const existing = await repository.findByName(tenantId, data.schoolId, data.name);
  if (existing) {
    throw new SalaryStructureAlreadyExistsError();
  }

  try {
    const structure = await repository.create({
      tenantId,
      schoolId: data.schoolId,
      name: data.name,
      createdBy: actingUserId,
    });
    return toDTO(structure);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new SalaryStructureAlreadyExistsError();
    }
    throw error;
  }
}

export async function updateSalaryStructure(id: string, input: unknown, context: PayrollContext): Promise<SalaryStructureDTO> {
  const parsed = updateSalaryStructureSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid salary structure data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaSalaryStructureRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new SalaryStructureNotFoundError();

  const structure = await repository.update(tenantId, id, { ...data, updatedBy: actingUserId });
  return toDTO(structure);
}

export async function deleteSalaryStructure(id: string, context: PayrollContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaSalaryStructureRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new SalaryStructureNotFoundError();
  await repository.softDelete(tenantId, id, actingUserId);
}

export async function listSalaryStructures(tenantId: string, schoolId: string): Promise<SalaryStructureDTO[]> {
  const repository = new PrismaSalaryStructureRepository();
  const structures = await repository.findBySchool(tenantId, schoolId);
  return structures.map(toDTO);
}

export async function getSalaryStructure(tenantId: string, id: string): Promise<SalaryStructureDTO | null> {
  const repository = new PrismaSalaryStructureRepository();
  const structure = await repository.findById(tenantId, id);
  return structure ? toDTO(structure) : null;
}

export async function getSalaryStructureWithComponents(
  tenantId: string,
  id: string
): Promise<SalaryStructureWithComponentsDTO | null> {
  const structureRepository = new PrismaSalaryStructureRepository();
  const structure = await structureRepository.findById(tenantId, id);
  if (!structure) return null;

  const componentRepository = new PrismaSalaryComponentRepository();
  const components = await componentRepository.findByStructure(tenantId, id);

  return { ...toDTO(structure), components: components.map(toSalaryComponentDTO) };
}

export { toDTO as toSalaryStructureDTO };
