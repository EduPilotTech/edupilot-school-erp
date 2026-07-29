export interface RouteStudentListRowDTO {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  stopId: string;
  stopName: string;
  tripType: string;
  status: string;
}

export interface RouteStudentListDTO {
  routeId: string;
  academicSessionId: string;
  rows: RouteStudentListRowDTO[];
}

export interface VehicleOccupancyRowDTO {
  vehicleId: string;
  registrationNumber: string;
  seatingCapacity: number;
  routeId: string;
  routeName: string;
  assignedStudentCount: number;
  occupancyPercent: number;
}

export interface VehicleOccupancyReportDTO {
  academicSessionId: string;
  rows: VehicleOccupancyRowDTO[];
}

export type ComplianceAlertEntityType = "VEHICLE" | "DRIVER";
export type ComplianceAlertField =
  | "INSURANCE"
  | "FITNESS"
  | "PERMIT"
  | "POLLUTION"
  | "LICENSE";

export interface ComplianceAlertDTO {
  entityType: ComplianceAlertEntityType;
  entityId: string;
  label: string;
  field: ComplianceAlertField;
  expiryDate: string;
  daysRemaining: number;
  isExpired: boolean;
}

export interface RouteFeeCollectionRowDTO {
  routeId: string;
  routeName: string;
  totalCollected: number;
  totalOutstanding: number;
}

export interface RouteFeeCollectionReportDTO {
  academicSessionId: string;
  rows: RouteFeeCollectionRowDTO[];
}
