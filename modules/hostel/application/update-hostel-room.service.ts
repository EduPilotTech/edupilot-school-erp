import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaHostelRoomRepository } from "../infrastructure/prisma-hostel-room.repository";
import { HostelRoomAlreadyExistsError, HostelRoomNotFoundError } from "../domain/errors";
import { updateHostelRoomSchema, type HostelRoomDTO } from "./dto/hostel-structure.dto";
import { toHostelRoomDTO } from "./create-hostel-room.service";
import type { HostelContext } from "./create-hostel.service";

export async function updateHostelRoom(
  roomId: string,
  input: unknown,
  context: HostelContext
): Promise<HostelRoomDTO> {
  const parsed = updateHostelRoomSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid room data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaHostelRoomRepository();
  const existing = await repository.findById(tenantId, roomId);
  if (!existing || existing.deletedAt !== null) {
    throw new HostelRoomNotFoundError();
  }

  try {
    const room = await repository.update(tenantId, roomId, {
      wingId: data.wingId,
      roomNumber: data.roomNumber,
      roomType: data.roomType,
      capacity: data.capacity,
      gender: data.gender,
      status: data.status,
      updatedBy: actingUserId,
    });
    return toHostelRoomDTO(room);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HostelRoomAlreadyExistsError();
    }
    throw error;
  }
}

export async function deleteHostelRoom(roomId: string, context: HostelContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaHostelRoomRepository();
  const existing = await repository.findById(tenantId, roomId);
  if (!existing || existing.deletedAt !== null) {
    throw new HostelRoomNotFoundError();
  }
  await repository.softDelete(tenantId, roomId, actingUserId);
}
