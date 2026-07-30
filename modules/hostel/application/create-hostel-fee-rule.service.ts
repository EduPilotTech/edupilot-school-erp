import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaHostelRepository } from "../infrastructure/prisma-hostel.repository";
import { PrismaHostelFeeRuleRepository } from "../infrastructure/prisma-hostel-fee-rule.repository";
import { HostelFeeRuleAlreadyExistsError, HostelNotFoundError } from "../domain/errors";
import { createHostelFeeRuleSchema, type HostelFeeRuleDTO } from "./dto/hostel-fee-rule.dto";
import type { HostelFeeRuleEntity } from "../domain/hostel-fee-rule.entity";
import type { HostelContext } from "./create-hostel.service";

function toDTO(entity: HostelFeeRuleEntity): HostelFeeRuleDTO {
  return {
    id: entity.id,
    hostelId: entity.hostelId,
    roomType: entity.roomType,
    academicSessionId: entity.academicSessionId,
    feeCategoryId: entity.feeCategoryId,
    amount: entity.amount,
    frequency: entity.frequency,
    isActive: entity.isActive,
  };
}

export async function createHostelFeeRule(input: unknown, context: HostelContext): Promise<HostelFeeRuleDTO> {
  const parsed = createHostelFeeRuleSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid hostel fee rule data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const hostelRepository = new PrismaHostelRepository();
  const hostel = await hostelRepository.findById(tenantId, data.hostelId);
  if (!hostel || hostel.deletedAt !== null) {
    throw new HostelNotFoundError();
  }

  const repository = new PrismaHostelFeeRuleRepository();
  try {
    const rule = await repository.create({
      tenantId,
      hostelId: data.hostelId,
      roomType: data.roomType,
      academicSessionId: data.academicSessionId,
      feeCategoryId: data.feeCategoryId,
      amount: data.amount,
      frequency: data.frequency,
      createdBy: actingUserId,
    });
    return toDTO(rule);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HostelFeeRuleAlreadyExistsError();
    }
    throw error;
  }
}

export { toDTO as toHostelFeeRuleDTO };
