import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaHostelRoomRepository } from "../infrastructure/prisma-hostel-room.repository";
import { PrismaHostelBedRepository } from "../infrastructure/prisma-hostel-bed.repository";
import { HostelRoomNotFoundError } from "../domain/errors";
import { createHostelBedSchema, type HostelBedDTO } from "./dto/hostel-structure.dto";
import type { HostelBedEntity } from "../domain/hostel-bed.entity";
import type { HostelContext } from "./create-hostel.service";

function toDTO(entity: HostelBedEntity): HostelBedDTO {
  return {
    id: entity.id,
    roomId: entity.roomId,
    bedNumber: entity.bedNumber,
    status: entity.status,
  };
}

// A room's beds are capped at its configured capacity — attempting to add more beds than the
// room can hold is rejected here, not left as a silent overbooking risk for the assignment
// services to discover later.
export async function createHostelBed(input: unknown, context: HostelContext): Promise<HostelBedDTO> {
  const parsed = createHostelBedSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid bed data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const roomRepository = new PrismaHostelRoomRepository();
  const room = await roomRepository.findById(tenantId, data.roomId);
  if (!room || room.deletedAt !== null) {
    throw new HostelRoomNotFoundError();
  }

  const bedRepository = new PrismaHostelBedRepository();
  const existingBeds = await bedRepository.findByRoom(tenantId, data.roomId);
  if (existingBeds.length >= room.capacity) {
    throw new ValidationError(`This room's capacity (${room.capacity}) is already fully accounted for.`);
  }

  try {
    const bed = await bedRepository.create({
      tenantId,
      roomId: data.roomId,
      bedNumber: data.bedNumber,
      createdBy: actingUserId,
    });
    return toDTO(bed);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ValidationError("A bed with this number already exists in this room.");
    }
    throw error;
  }
}

export { toDTO as toHostelBedDTO };
