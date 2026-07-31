import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaSalaryStructureRepository } from "../infrastructure/prisma-salary-structure.repository";
import { PrismaSalaryComponentRepository } from "../infrastructure/prisma-salary-component.repository";
import { SalaryComponentAlreadyExistsError, SalaryComponentNotFoundError, SalaryStructureNotFoundError } from "../domain/errors";
import {
  addSalaryComponentSchema,
  updateSalaryComponentSchema,
  type SalaryComponentDTO,
} from "./dto/salary-structure.dto";
import type { SalaryComponentEntity } from "../domain/salary-structure.entity";
import type { PayrollContext } from "./payroll-context";

function toDTO(entity: SalaryComponentEntity): SalaryComponentDTO {
  return {
    id: entity.id,
    salaryStructureId: entity.salaryStructureId,
    name: entity.name,
    code: entity.code,
    componentType: entity.componentType,
    calculationType: entity.calculationType,
    value: entity.value,
    isStatutory: entity.isStatutory,
    isActive: entity.isActive,
  };
}

export async function addSalaryComponent(input: unknown, context: PayrollContext): Promise<SalaryComponentDTO> {
  const parsed = addSalaryComponentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid salary component data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const structureRepository = new PrismaSalaryStructureRepository();
  const structure = await structureRepository.findById(tenantId, data.salaryStructureId);
  if (!structure || structure.deletedAt !== null) {
    throw new SalaryStructureNotFoundError();
  }

  const componentRepository = new PrismaSalaryComponentRepository();
  const existing = await componentRepository.findByCode(tenantId, data.salaryStructureId, data.code);
  if (existing) {
    throw new SalaryComponentAlreadyExistsError();
  }

  try {
    const component = await componentRepository.create({
      tenantId,
      salaryStructureId: data.salaryStructureId,
      name: data.name,
      code: data.code,
      componentType: data.componentType,
      calculationType: data.calculationType,
      value: data.value,
      isStatutory: data.isStatutory ?? false,
      createdBy: actingUserId,
    });
    return toDTO(component);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new SalaryComponentAlreadyExistsError();
    }
    throw error;
  }
}

export async function updateSalaryComponent(id: string, input: unknown, context: PayrollContext): Promise<SalaryComponentDTO> {
  const parsed = updateSalaryComponentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid salary component data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaSalaryComponentRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new SalaryComponentNotFoundError();

  const component = await repository.update(tenantId, id, { ...data, updatedBy: actingUserId });
  return toDTO(component);
}

// Soft-deletes the component (deactivate + deletedAt), mirroring BookRepository's own
// deactivate/soft-delete shape for a structure's line item.
export async function deleteSalaryComponent(id: string, context: PayrollContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaSalaryComponentRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new SalaryComponentNotFoundError();
  await repository.softDelete(tenantId, id, actingUserId);
}

export async function listSalaryComponents(tenantId: string, salaryStructureId: string, activeOnly?: boolean): Promise<SalaryComponentDTO[]> {
  const repository = new PrismaSalaryComponentRepository();
  const components = await repository.findByStructure(tenantId, salaryStructureId, activeOnly);
  return components.map(toDTO);
}

export { toDTO as toSalaryComponentDTO };
