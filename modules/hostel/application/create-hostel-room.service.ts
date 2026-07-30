import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaHostelFloorRepository } from "../infrastructure/prisma-hostel-floor.repository";
import { PrismaHostelRoomRepository } from "../infrastructure/prisma-hostel-room.repository";
import { HostelFloorNotFoundError, HostelRoomAlreadyExistsError } from "../domain/errors";
import { createHostelRoomSchema, type HostelRoomDTO } from "./dto/hostel-structure.dto";
import type { HostelRoomEntity } from "../domain/hostel-room.entity";
import type { HostelContext } from "./create-hostel.service";

function toDTO(entity: HostelRoomEntity): HostelRoomDTO {
  return {
    id: entity.id,
    floorId: entity.floorId,
    wingId: entity.wingId,
    roomNumber: entity.roomNumber,
    roomType: entity.roomType,
    capacity: entity.capacity,
    gender: entity.gender,
    status: entity.status,
  };
}

export async function createHostelRoom(input: unknown, context: HostelContext): Promise<HostelRoomDTO> {
  const parsed = createHostelRoomSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid room data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const floorRepository = new PrismaHostelFloorRepository();
  const floor = await floorRepository.findById(tenantId, data.floorId);
  if (!floor || floor.deletedAt !== null) {
    throw new HostelFloorNotFoundError();
  }

  const repository = new PrismaHostelRoomRepository();
  try {
    const room = await repository.create({
      tenantId,
      floorId: data.floorId,
      wingId: data.wingId ?? null,
      roomNumber: data.roomNumber,
      roomType: data.roomType,
      capacity: data.capacity,
      gender: data.gender,
      createdBy: actingUserId,
    });
    return toDTO(room);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HostelRoomAlreadyExistsError();
    }
    throw error;
  }
}

export { toDTO as toHostelRoomDTO };
