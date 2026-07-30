import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import { StudentNotFoundError, InvalidAcademicSessionError, StudentNotEnrolledInSessionError } from "@/modules/students/domain/errors";
import {
  HostelNotFoundError,
  HostelAlreadyExistsError,
  HostelBuildingNotFoundError,
  HostelBuildingAlreadyExistsError,
  HostelFloorNotFoundError,
  HostelWingNotFoundError,
  HostelRoomNotFoundError,
  HostelRoomAlreadyExistsError,
  HostelBedNotFoundError,
  BedNotAvailableError,
  RoomCapacityExceededError,
  StudentHostelAssignmentNotFoundError,
  StudentAlreadyAssignedError,
  GenderMismatchError,
  HostelLeaveRequestNotFoundError,
  LeaveRequestNotPendingError,
  HostelVisitorNotFoundError,
  VisitorAlreadyExitedError,
  MessMealPlanNotFoundError,
  MessMealNotFoundError,
  HostelFeeRuleNotFoundError,
  HostelFeeRuleAlreadyExistsError,
  InvoiceAlreadyGeneratedFromRuleError,
  InvalidHostelAssignmentError,
} from "@/modules/hostel/domain/errors";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Shared by every app/hostel/**/actions.ts file — instanceof-only, matching
// translateTransportError.ts's own precedent (docs/CODING_STANDARDS.md §5). Unexpected errors are
// rethrown, never swallowed.
export function translateHostelError(error: unknown): ActionResult<never> {
  if (error instanceof StudentNotFoundError) {
    return { success: false, error: { code: "STUDENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof InvalidAcademicSessionError) {
    return { success: false, error: { code: "INVALID_ACADEMIC_SESSION", message: error.message } };
  }
  if (error instanceof StudentNotEnrolledInSessionError) {
    return { success: false, error: { code: "STUDENT_NOT_ENROLLED", message: error.message } };
  }
  if (error instanceof HostelAlreadyExistsError) {
    return { success: false, error: { code: "HOSTEL_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof HostelNotFoundError) {
    return { success: false, error: { code: "HOSTEL_NOT_FOUND", message: error.message } };
  }
  if (error instanceof HostelBuildingAlreadyExistsError) {
    return { success: false, error: { code: "HOSTEL_BUILDING_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof HostelBuildingNotFoundError) {
    return { success: false, error: { code: "HOSTEL_BUILDING_NOT_FOUND", message: error.message } };
  }
  if (error instanceof HostelFloorNotFoundError) {
    return { success: false, error: { code: "HOSTEL_FLOOR_NOT_FOUND", message: error.message } };
  }
  if (error instanceof HostelWingNotFoundError) {
    return { success: false, error: { code: "HOSTEL_WING_NOT_FOUND", message: error.message } };
  }
  if (error instanceof HostelRoomAlreadyExistsError) {
    return { success: false, error: { code: "HOSTEL_ROOM_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof HostelRoomNotFoundError) {
    return { success: false, error: { code: "HOSTEL_ROOM_NOT_FOUND", message: error.message } };
  }
  if (error instanceof HostelBedNotFoundError) {
    return { success: false, error: { code: "HOSTEL_BED_NOT_FOUND", message: error.message } };
  }
  if (error instanceof BedNotAvailableError) {
    return { success: false, error: { code: "BED_NOT_AVAILABLE", message: error.message } };
  }
  if (error instanceof RoomCapacityExceededError) {
    return { success: false, error: { code: "ROOM_CAPACITY_EXCEEDED", message: error.message } };
  }
  if (error instanceof StudentAlreadyAssignedError) {
    return { success: false, error: { code: "STUDENT_ALREADY_ASSIGNED", message: error.message } };
  }
  if (error instanceof StudentHostelAssignmentNotFoundError) {
    return { success: false, error: { code: "STUDENT_HOSTEL_ASSIGNMENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof GenderMismatchError) {
    return { success: false, error: { code: "GENDER_MISMATCH", message: error.message } };
  }
  if (error instanceof LeaveRequestNotPendingError) {
    return { success: false, error: { code: "LEAVE_REQUEST_NOT_PENDING", message: error.message } };
  }
  if (error instanceof HostelLeaveRequestNotFoundError) {
    return { success: false, error: { code: "HOSTEL_LEAVE_REQUEST_NOT_FOUND", message: error.message } };
  }
  if (error instanceof VisitorAlreadyExitedError) {
    return { success: false, error: { code: "VISITOR_ALREADY_EXITED", message: error.message } };
  }
  if (error instanceof HostelVisitorNotFoundError) {
    return { success: false, error: { code: "HOSTEL_VISITOR_NOT_FOUND", message: error.message } };
  }
  if (error instanceof MessMealPlanNotFoundError) {
    return { success: false, error: { code: "MESS_MEAL_PLAN_NOT_FOUND", message: error.message } };
  }
  if (error instanceof MessMealNotFoundError) {
    return { success: false, error: { code: "MESS_MEAL_NOT_FOUND", message: error.message } };
  }
  if (error instanceof HostelFeeRuleAlreadyExistsError) {
    return { success: false, error: { code: "HOSTEL_FEE_RULE_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof HostelFeeRuleNotFoundError) {
    return { success: false, error: { code: "HOSTEL_FEE_RULE_NOT_FOUND", message: error.message } };
  }
  if (error instanceof InvoiceAlreadyGeneratedFromRuleError) {
    return { success: false, error: { code: "INVOICE_ALREADY_GENERATED", message: error.message } };
  }
  if (error instanceof InvalidHostelAssignmentError) {
    return { success: false, error: { code: "INVALID_HOSTEL_ASSIGNMENT", message: error.message } };
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
