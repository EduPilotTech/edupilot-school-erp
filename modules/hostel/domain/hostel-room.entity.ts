export type RoomTypeValue = "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY" | "OTHER";
export type RoomGenderTypeValue = "BOYS" | "GIRLS" | "CO_ED";

// Decision (mirrors Vehicle's own precedent) — operationally distinct states, not a boolean.
export type RoomStatusValue = "ACTIVE" | "MAINTENANCE" | "INACTIVE";

export interface HostelRoomEntity {
  id: string;
  tenantId: string;
  floorId: string;
  wingId: string | null;
  roomNumber: string;
  roomType: RoomTypeValue;
  capacity: number;
  gender: RoomGenderTypeValue;
  status: RoomStatusValue;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
