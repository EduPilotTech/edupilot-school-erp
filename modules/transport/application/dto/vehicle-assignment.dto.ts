import { z } from "zod";

export const assignVehicleToRouteSchema = z.object({
  routeId: z.string().uuid("Route is required."),
  academicSessionId: z.string().uuid("Academic session is required."),
  vehicleId: z.string().uuid("Vehicle is required."),
  driverId: z.string().uuid("Driver is required."),
  helperId: z.string().uuid().optional(),
});
export type AssignVehicleToRouteServiceInput = z.infer<typeof assignVehicleToRouteSchema>;

export interface VehicleAssignmentDTO {
  id: string;
  routeId: string;
  academicSessionId: string;
  vehicleId: string;
  driverId: string;
  helperId: string | null;
  isActive: boolean;
}
