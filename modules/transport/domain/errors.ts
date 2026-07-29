import { BusinessRuleError, NotFoundError, ValidationError } from "@/lib/errors";

export class VehicleNotFoundError extends NotFoundError {
  constructor() {
    super("Vehicle not found.");
  }
}

export class VehicleAlreadyExistsError extends BusinessRuleError {
  constructor() {
    super("A vehicle with this registration number already exists.");
  }
}

export class DriverNotFoundError extends NotFoundError {
  constructor() {
    super("Driver not found.");
  }
}

export class DriverAlreadyExistsError extends BusinessRuleError {
  constructor() {
    super("A driver with this employee code already exists.");
  }
}

export class HelperNotFoundError extends NotFoundError {
  constructor() {
    super("Helper not found.");
  }
}

export class HelperAlreadyExistsError extends BusinessRuleError {
  constructor() {
    super("A helper with this employee code already exists.");
  }
}

export class RouteNotFoundError extends NotFoundError {
  constructor() {
    super("Route not found.");
  }
}

export class RouteAlreadyExistsError extends BusinessRuleError {
  constructor() {
    super("A route with this code already exists.");
  }
}

export class RouteStopNotFoundError extends NotFoundError {
  constructor() {
    super("Route stop not found.");
  }
}

export class VehicleAssignmentNotFoundError extends NotFoundError {
  constructor() {
    super("This route has no vehicle assignment for this academic session.");
  }
}

export class VehicleAlreadyAssignedError extends BusinessRuleError {
  constructor() {
    super("This vehicle is already assigned to another route for this academic session.");
  }
}

export class StudentTransportAssignmentNotFoundError extends NotFoundError {
  constructor() {
    super("This student has no transport assignment for this academic session.");
  }
}

export class RouteFeeRuleNotFoundError extends NotFoundError {
  constructor() {
    super("Route fee rule not found.");
  }
}

export class RouteFeeRuleAlreadyExistsError extends BusinessRuleError {
  constructor() {
    super("A fee rule for this route, fee category, and academic session already exists.");
  }
}

export class InvalidTransportAssignmentError extends ValidationError {
  constructor(message: string) {
    super(message);
  }
}
