import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import { StudentNotFoundError, InvalidAcademicSessionError } from "@/modules/students/domain/errors";
import {
  VehicleNotFoundError,
  VehicleAlreadyExistsError,
  DriverNotFoundError,
  DriverAlreadyExistsError,
  HelperNotFoundError,
  HelperAlreadyExistsError,
  RouteNotFoundError,
  RouteAlreadyExistsError,
  RouteStopNotFoundError,
  VehicleAssignmentNotFoundError,
  VehicleAlreadyAssignedError,
  StudentTransportAssignmentNotFoundError,
  RouteFeeRuleNotFoundError,
  RouteFeeRuleAlreadyExistsError,
  InvalidTransportAssignmentError,
} from "@/modules/transport/domain/errors";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Shared by every app/transport/**/actions.ts file — instanceof-only, matching
// translateFeeError.ts's own precedent (docs/CODING_STANDARDS.md §5). Unexpected errors are
// rethrown, never swallowed.
export function translateTransportError(error: unknown): ActionResult<never> {
  if (error instanceof StudentNotFoundError) {
    return { success: false, error: { code: "STUDENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof InvalidAcademicSessionError) {
    return { success: false, error: { code: "INVALID_ACADEMIC_SESSION", message: error.message } };
  }
  if (error instanceof VehicleAlreadyExistsError) {
    return { success: false, error: { code: "VEHICLE_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof VehicleNotFoundError) {
    return { success: false, error: { code: "VEHICLE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof DriverAlreadyExistsError) {
    return { success: false, error: { code: "DRIVER_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof DriverNotFoundError) {
    return { success: false, error: { code: "DRIVER_NOT_FOUND", message: error.message } };
  }
  if (error instanceof HelperAlreadyExistsError) {
    return { success: false, error: { code: "HELPER_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof HelperNotFoundError) {
    return { success: false, error: { code: "HELPER_NOT_FOUND", message: error.message } };
  }
  if (error instanceof RouteAlreadyExistsError) {
    return { success: false, error: { code: "ROUTE_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof RouteNotFoundError) {
    return { success: false, error: { code: "ROUTE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof RouteStopNotFoundError) {
    return { success: false, error: { code: "ROUTE_STOP_NOT_FOUND", message: error.message } };
  }
  if (error instanceof VehicleAlreadyAssignedError) {
    return { success: false, error: { code: "VEHICLE_ALREADY_ASSIGNED", message: error.message } };
  }
  if (error instanceof VehicleAssignmentNotFoundError) {
    return { success: false, error: { code: "VEHICLE_ASSIGNMENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof StudentTransportAssignmentNotFoundError) {
    return { success: false, error: { code: "STUDENT_TRANSPORT_ASSIGNMENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof RouteFeeRuleAlreadyExistsError) {
    return { success: false, error: { code: "ROUTE_FEE_RULE_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof RouteFeeRuleNotFoundError) {
    return { success: false, error: { code: "ROUTE_FEE_RULE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof InvalidTransportAssignmentError) {
    return { success: false, error: { code: "INVALID_TRANSPORT_ASSIGNMENT", message: error.message } };
  }
  if (error instanceof NotFoundError) {
    return { success: false, error: { code: "NOT_FOUND", message: error.message } };
  }
  if (error instanceof BusinessRuleError) {
    return { success: false, error: { code: "BUSINESS_RULE_VIOLATION", message: error.message } };
  }
  if (error instanceof ValidationError) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: error.message } };
  }

  throw error;
}
