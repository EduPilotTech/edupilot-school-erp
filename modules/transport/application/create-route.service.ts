import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaRouteRepository } from "../infrastructure/prisma-route.repository";
import { RouteAlreadyExistsError } from "../domain/errors";
import { createRouteSchema, type RouteDTO } from "./dto/route.dto";
import type { RouteEntity } from "../domain/route.entity";

export interface RouteContext {
  tenantId: string;
  schoolId: string;
  actingUserId: string;
}

function toDTO(entity: RouteEntity): RouteDTO {
  return {
    id: entity.id,
    schoolId: entity.schoolId,
    name: entity.name,
    code: entity.code,
    description: entity.description,
    isActive: entity.isActive,
  };
}

export async function createRoute(input: unknown, context: RouteContext): Promise<RouteDTO> {
  const parsed = createRouteSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid route data.");
  }
  const data = parsed.data;
  const { tenantId, schoolId, actingUserId } = context;

  const repository = new PrismaRouteRepository();
  const existing = await repository.findByCode(tenantId, data.code);
  if (existing) {
    throw new RouteAlreadyExistsError();
  }

  try {
    const route = await repository.create({
      tenantId,
      schoolId,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      createdBy: actingUserId,
    });
    return toDTO(route);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new RouteAlreadyExistsError();
    }
    throw error;
  }
}

export { toDTO as toRouteDTO };
