import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { InvalidClassError } from "@/modules/students/domain/errors";
import { PrismaClassRepository } from "@/modules/academics/infrastructure/prisma-class.repository";
import { PrismaFeeCategoryRepository } from "../infrastructure/prisma-fee-category.repository";
import { PrismaFeeStructureRepository } from "../infrastructure/prisma-fee-structure.repository";
import { PrismaFeeStructureItemRepository } from "../infrastructure/prisma-fee-structure-item.repository";
import {
  FeeCategoryNotFoundError,
  FeeStructureItemAlreadyExistsError,
  FeeStructureNotFoundError,
} from "../domain/errors";
import { addFeeStructureItemSchema, type FeeStructureItemDTO } from "./dto/fee-structure.dto";
import type { FeeStructureItemEntity } from "../domain/fee-structure.entity";

export interface FeeStructureItemContext {
  tenantId: string;
  actingUserId: string;
}

function toDTO(entity: FeeStructureItemEntity): FeeStructureItemDTO {
  return {
    id: entity.id,
    feeStructureId: entity.feeStructureId,
    classId: entity.classId,
    feeCategoryId: entity.feeCategoryId,
    amount: entity.amount,
    frequency: entity.frequency,
    dueDayOfMonth: entity.dueDayOfMonth,
    isActive: entity.isActive,
  };
}

// `classId` is always set — a whole-school fee (e.g. Admission) is applied one row per class,
// never a nullable "all classes" wildcard; see fee-structure-item.repository.ts's own comment.
export async function addFeeStructureItem(
  input: unknown,
  context: FeeStructureItemContext
): Promise<FeeStructureItemDTO> {
  const parsed = addFeeStructureItemSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid fee structure item data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const structureRepository = new PrismaFeeStructureRepository();
  const structure = await structureRepository.findById(tenantId, data.feeStructureId);
  if (!structure || structure.deletedAt !== null) {
    throw new FeeStructureNotFoundError();
  }

  const classRepository = new PrismaClassRepository();
  const classEntity = await classRepository.findById(tenantId, data.classId);
  if (!classEntity || classEntity.deletedAt !== null) {
    throw new InvalidClassError();
  }

  const categoryRepository = new PrismaFeeCategoryRepository();
  const category = await categoryRepository.findById(tenantId, data.feeCategoryId);
  if (!category || category.deletedAt !== null) {
    throw new FeeCategoryNotFoundError();
  }

  const repository = new PrismaFeeStructureItemRepository();
  const existing = await repository.findByStructureAndClass(tenantId, data.feeStructureId, data.classId);
  if (existing.some((item) => item.feeCategoryId === data.feeCategoryId)) {
    throw new FeeStructureItemAlreadyExistsError();
  }

  try {
    const item = await repository.create({
      tenantId,
      feeStructureId: data.feeStructureId,
      classId: data.classId,
      feeCategoryId: data.feeCategoryId,
      amount: data.amount,
      frequency: data.frequency,
      dueDayOfMonth: data.dueDayOfMonth ?? null,
      createdBy: actingUserId,
    });
    return toDTO(item);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new FeeStructureItemAlreadyExistsError();
    }
    throw error;
  }
}

export { toDTO as toFeeStructureItemDTO };
