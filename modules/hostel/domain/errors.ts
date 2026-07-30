import { BusinessRuleError, NotFoundError, ValidationError } from "@/lib/errors";

export class HostelNotFoundError extends NotFoundError {
  constructor() {
    super("Hostel not found.");
  }
}

export class HostelAlreadyExistsError extends BusinessRuleError {
  constructor() {
    super("A hostel with this code already exists.");
  }
}

export class HostelBuildingNotFoundError extends NotFoundError {
  constructor() {
    super("Hostel building not found.");
  }
}

export class HostelBuildingAlreadyExistsError extends BusinessRuleError {
  constructor() {
    super("A building with this code already exists in this hostel.");
  }
}

export class HostelFloorNotFoundError extends NotFoundError {
  constructor() {
    super("Hostel floor not found.");
  }
}

export class HostelWingNotFoundError extends NotFoundError {
  constructor() {
    super("Hostel wing not found.");
  }
}

export class HostelRoomNotFoundError extends NotFoundError {
  constructor() {
    super("Hostel room not found.");
  }
}

export class HostelRoomAlreadyExistsError extends BusinessRuleError {
  constructor() {
    super("A room with this number already exists on this floor.");
  }
}

export class HostelBedNotFoundError extends NotFoundError {
  constructor() {
    super("Hostel bed not found.");
  }
}

export class BedNotAvailableError extends BusinessRuleError {
  constructor() {
    super("This bed is not available for assignment.");
  }
}

export class RoomCapacityExceededError extends BusinessRuleError {
  constructor() {
    super("This room has no vacant beds.");
  }
}

export class StudentHostelAssignmentNotFoundError extends NotFoundError {
  constructor() {
    super("This student has no active hostel assignment.");
  }
}

export class StudentAlreadyAssignedError extends BusinessRuleError {
  constructor() {
    super("This student already has an active hostel assignment for this session.");
  }
}

export class GenderMismatchError extends ValidationError {
  constructor() {
    super("This room's gender designation does not match the student's gender.");
  }
}

export class HostelLeaveRequestNotFoundError extends NotFoundError {
  constructor() {
    super("Leave request not found.");
  }
}

export class LeaveRequestNotPendingError extends BusinessRuleError {
  constructor(message = "This leave request has already been decided.") {
    super(message);
  }
}

export class HostelVisitorNotFoundError extends NotFoundError {
  constructor() {
    super("Visitor log entry not found.");
  }
}

export class VisitorAlreadyExitedError extends BusinessRuleError {
  constructor() {
    super("This visitor has already been recorded as exited.");
  }
}

export class MessMealPlanNotFoundError extends NotFoundError {
  constructor() {
    super("Meal plan not found.");
  }
}

export class MessMealNotFoundError extends NotFoundError {
  constructor() {
    super("Meal not found.");
  }
}

export class HostelFeeRuleNotFoundError extends NotFoundError {
  constructor() {
    super("Hostel fee rule not found.");
  }
}

export class HostelFeeRuleAlreadyExistsError extends BusinessRuleError {
  constructor() {
    super("A fee rule for this hostel, room type, fee category, and academic session already exists.");
  }
}

export class InvoiceAlreadyGeneratedFromRuleError extends BusinessRuleError {
  constructor() {
    super("An invoice has already been generated for this student and hostel fee rule.");
  }
}

export class InvalidHostelAssignmentError extends ValidationError {
  constructor(message: string) {
    super(message);
  }
}
