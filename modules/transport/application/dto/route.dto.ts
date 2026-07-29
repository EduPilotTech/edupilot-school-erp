import { z } from "zod";

export const createRouteSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  code: z.string().trim().min(1, "Code is required."),
  description: z.string().trim().max(500).optional(),
});
export type CreateRouteServiceInput = z.infer<typeof createRouteSchema>;

export const updateRouteSchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateRouteServiceInput = z.infer<typeof updateRouteSchema>;

export interface RouteDTO {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
}

export const createRouteStopSchema = z.object({
  routeId: z.string().uuid("Route is required."),
  name: z.string().trim().min(1, "Name is required."),
  sequenceOrder: z.number().int().min(1, "Sequence order must be at least 1."),
  pickupTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Pickup time must be in HH:mm format.")
    .optional(),
  dropTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Drop time must be in HH:mm format.")
    .optional(),
  landmark: z.string().trim().max(200).optional(),
});
export type CreateRouteStopServiceInput = z.infer<typeof createRouteStopSchema>;

export const updateRouteStopSchema = z.object({
  name: z.string().trim().min(1).optional(),
  sequenceOrder: z.number().int().min(1).optional(),
  pickupTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Pickup time must be in HH:mm format.")
    .nullable()
    .optional(),
  dropTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Drop time must be in HH:mm format.")
    .nullable()
    .optional(),
  landmark: z.string().trim().max(200).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateRouteStopServiceInput = z.infer<typeof updateRouteStopSchema>;

export interface RouteStopDTO {
  id: string;
  routeId: string;
  name: string;
  sequenceOrder: number;
  pickupTime: string | null;
  dropTime: string | null;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
}
