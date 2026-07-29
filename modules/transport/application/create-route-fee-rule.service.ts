import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaRouteRepository } from "../infrastructure/prisma-route.repository";
import { PrismaRouteFeeRuleRepository } from "../infrastructure/prisma-route-fee-rule.repository";
import { RouteFeeRuleAlreadyExistsError, RouteNotFoundError } from "../domain/errors";
import { createRouteFeeRuleSchema, type RouteFeeRuleDTO } from "./dto/route-fee-rule.dto";
import type { RouteFeeRuleEntity } from "../domain/route-fee-rule.entity";
import type { TransportContext } from "./create-vehicle.service";

function toDTO(entity: RouteFeeRuleEntity): RouteFeeRuleDTO {
  return {
    id: entity.id,
    routeId: entity.routeId,
    academicSessionId: entity.academicSessionId,
    feeCategoryId: entity.feeCategoryId,
    amount: entity.amount,
    frequency: entity.frequency,
    isActive: entity.isActive,
  };
}

export async function createRouteFeeRule(input: unknown, context: TransportContext): Promise<RouteFeeRuleDTO> {
  const parsed = createRouteFeeRuleSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid route fee rule data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const routeRepository = new PrismaRouteRepository();
  const route = await routeRepository.findById(tenantId, data.routeId);
  if (!route || route.deletedAt !== null) {
    throw new RouteNotFoundError();
  }

  const repository = new PrismaRouteFeeRuleRepository();
  try {
    const rule = await repository.create({
      tenantId,
      routeId: data.routeId,
      academicSessionId: data.academicSessionId,
      feeCategoryId: data.feeCategoryId,
      amount: data.amount,
      frequency: data.frequency,
      createdBy: actingUserId,
    });
    return toDTO(rule);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new RouteFeeRuleAlreadyExistsError();
    }
    throw error;
  }
}

export { toDTO as toRouteFeeRuleDTO };
