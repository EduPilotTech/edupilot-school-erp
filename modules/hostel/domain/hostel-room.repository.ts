import type { HostelRoomEntity, RoomGenderTypeValue, RoomStatusValue, RoomTypeValue } from "./hostel-room.entity";

export interface CreateHostelRoomInput {
  tenantId: string;
  floorId: string;
  wingId?: string | null;
  roomNumber: string;
  roomType: RoomTypeValue;
  capacity: number;
  gender: RoomGenderTypeValue;
  createdBy?: string | null;
}

export interface UpdateHostelRoomInput {
  wingId?: string | null;
  roomNumber?: string;
  roomType?: RoomTypeValue;
  capacity?: number;
  gender?: RoomGenderTypeValue;
  status?: RoomStatusValue;
  updatedBy?: string | null;
}

export interface HostelRoomRepository {
  findById(tenantId: string, id: string): Promise<HostelRoomEntity | null>;
  findByFloor(tenantId: string, floorId: string): Promise<HostelRoomEntity[]>;
  findByHostel(tenantId: string, hostelId: string, filter?: { status?: RoomStatusValue }): Promise<HostelRoomEntity[]>;
  create(input: CreateHostelRoomInput): Promise<HostelRoomEntity>;
  update(tenantId: string, id: string, input: UpdateHostelRoomInput): Promise<HostelRoomEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HostelRoomEntity>;
}
