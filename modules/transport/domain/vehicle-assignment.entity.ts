// Decision 2: a 1:1 Route<->Vehicle<->Driver(+Helper) mapping per session for V1. One row per
// (route, academicSession); reassigning the crew/vehicle updates this same row.
export interface VehicleAssignmentEntity {
  id: string;
  tenantId: string;
  routeId: string;
  academicSessionId: string;
  vehicleId: string;
  driverId: string;
  helperId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
