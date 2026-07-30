import "server-only";
import { PrismaHostelRoomRepository } from "../infrastructure/prisma-hostel-room.repository";
import { toHostelRoomDTO } from "./create-hostel-room.service";
import type { HostelRoomDTO } from "./dto/hostel-structure.dto";
import type { RoomStatusValue } from "../domain/hostel-room.entity";

export async function listHostelRoomsByFloor(context: { tenantId: string }, floorId: string): Promise<HostelRoomDTO[]> {
  const repository = new PrismaHostelRoomRepository();
  const rooms = await repository.findByFloor(context.tenantId, floorId);
  return rooms.map(toHostelRoomDTO);
}

export async function listHostelRoomsByHostel(
  context: { tenantId: string },
  hostelId: string,
  filter?: { status?: RoomStatusValue }
): Promise<HostelRoomDTO[]> {
  const repository = new PrismaHostelRoomRepository();
  const rooms = await repository.findByHostel(context.tenantId, hostelId, filter);
  return rooms.map(toHostelRoomDTO);
}

export async function getHostelRoom(tenantId: string, roomId: string): Promise<HostelRoomDTO | null> {
  const repository = new PrismaHostelRoomRepository();
  const room = await repository.findById(tenantId, roomId);
  return room ? toHostelRoomDTO(room) : null;
}
