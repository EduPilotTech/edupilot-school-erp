import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { HostelRoom as PrismaHostelRoom } from "@/lib/generated/prisma/client";
import type {
  CreateHostelRoomInput,
  HostelRoomRepository,
  UpdateHostelRoomInput,
} from "../domain/hostel-room.repository";
import type { HostelRoomEntity, RoomStatusValue } from "../domain/hostel-room.entity";

function toEntity(row: PrismaHostelRoom): HostelRoomEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    floorId: row.floorId,
    wingId: row.wingId,
    roomNumber: row.roomNumber,
    roomType: row.roomType,
    capacity: row.capacity,
    gender: row.gender,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaHostelRoomRepository implements HostelRoomRepository {
  async findById(tenantId: string, id: string): Promise<HostelRoomEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelRoom.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByFloor(tenantId: string, floorId: string): Promise<HostelRoomEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.hostelRoom.findMany({
        where: { tenantId, floorId, deletedAt: null },
        orderBy: { roomNumber: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async findByHostel(
    tenantId: string,
    hostelId: string,
    filter?: { status?: RoomStatusValue }
  ): Promise<HostelRoomEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.hostelRoom.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: filter?.status,
          floor: { building: { hostelId } },
        },
        orderBy: { roomNumber: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateHostelRoomInput): Promise<HostelRoomEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.hostelRoom.create({
        data: {
          tenantId: input.tenantId,
          floorId: input.floorId,
          wingId: input.wingId ?? null,
          roomNumber: input.roomNumber,
          roomType: input.roomType,
          capacity: input.capacity,
          gender: input.gender,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateHostelRoomInput): Promise<HostelRoomEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelRoom.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          wingId: input.wingId,
          roomNumber: input.roomNumber,
          roomType: input.roomType,
          capacity: input.capacity,
          gender: input.gender,
          status: input.status,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HostelRoomEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelRoom.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), status: "INACTIVE", updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
