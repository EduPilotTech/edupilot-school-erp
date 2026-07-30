import { z } from "zod";

// --- Building --------------------------------------------------------------------------------

export const createHostelBuildingSchema = z.object({
  hostelId: z.string().uuid("Hostel is required."),
  name: z.string().trim().min(1, "Name is required."),
  code: z.string().trim().min(1, "Code is required."),
});
export type CreateHostelBuildingServiceInput = z.infer<typeof createHostelBuildingSchema>;

export const updateHostelBuildingSchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateHostelBuildingServiceInput = z.infer<typeof updateHostelBuildingSchema>;

export interface HostelBuildingDTO {
  id: string;
  hostelId: string;
  name: string;
  code: string;
  isActive: boolean;
}

// --- Floor -------------------------------------------------------------------------------------

export const createHostelFloorSchema = z.object({
  buildingId: z.string().uuid("Building is required."),
  name: z.string().trim().min(1, "Name is required."),
  floorNumber: z.number().int(),
});
export type CreateHostelFloorServiceInput = z.infer<typeof createHostelFloorSchema>;

export const updateHostelFloorSchema = z.object({
  name: z.string().trim().min(1).optional(),
  floorNumber: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateHostelFloorServiceInput = z.infer<typeof updateHostelFloorSchema>;

export interface HostelFloorDTO {
  id: string;
  buildingId: string;
  name: string;
  floorNumber: number;
  isActive: boolean;
}

// --- Wing --------------------------------------------------------------------------------------

export const createHostelWingSchema = z.object({
  buildingId: z.string().uuid("Building is required."),
  name: z.string().trim().min(1, "Name is required."),
});
export type CreateHostelWingServiceInput = z.infer<typeof createHostelWingSchema>;

export const updateHostelWingSchema = z.object({
  name: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateHostelWingServiceInput = z.infer<typeof updateHostelWingSchema>;

export interface HostelWingDTO {
  id: string;
  buildingId: string;
  name: string;
  isActive: boolean;
}

// --- Room --------------------------------------------------------------------------------------

const roomTypeEnum = z.enum(["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY", "OTHER"]);
const roomGenderEnum = z.enum(["BOYS", "GIRLS", "CO_ED"]);
const roomStatusEnum = z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]);

export const createHostelRoomSchema = z.object({
  floorId: z.string().uuid("Floor is required."),
  wingId: z.string().uuid().optional(),
  roomNumber: z.string().trim().min(1, "Room number is required."),
  roomType: roomTypeEnum,
  capacity: z.number().int().min(1, "Capacity must be at least 1."),
  gender: roomGenderEnum,
});
export type CreateHostelRoomServiceInput = z.infer<typeof createHostelRoomSchema>;

export const updateHostelRoomSchema = z.object({
  wingId: z.string().uuid().nullable().optional(),
  roomNumber: z.string().trim().min(1).optional(),
  roomType: roomTypeEnum.optional(),
  capacity: z.number().int().min(1).optional(),
  gender: roomGenderEnum.optional(),
  status: roomStatusEnum.optional(),
});
export type UpdateHostelRoomServiceInput = z.infer<typeof updateHostelRoomSchema>;

export interface HostelRoomDTO {
  id: string;
  floorId: string;
  wingId: string | null;
  roomNumber: string;
  roomType: string;
  capacity: number;
  gender: string;
  status: string;
}

// --- Bed ---------------------------------------------------------------------------------------

export const createHostelBedSchema = z.object({
  roomId: z.string().uuid("Room is required."),
  bedNumber: z.string().trim().min(1, "Bed number is required."),
});
export type CreateHostelBedServiceInput = z.infer<typeof createHostelBedSchema>;

export const updateHostelBedSchema = z.object({
  bedNumber: z.string().trim().min(1).optional(),
});
export type UpdateHostelBedServiceInput = z.infer<typeof updateHostelBedSchema>;

export interface HostelBedDTO {
  id: string;
  roomId: string;
  bedNumber: string;
  status: string;
}
