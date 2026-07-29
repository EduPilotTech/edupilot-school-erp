// Base domain/application error hierarchy, per docs/CODING_STANDARDS.md §5. Application
// services throw these (or a module-specific subclass of one of these — see e.g.
// modules/students/domain/errors.ts), never a bare `Error` or a string. Server Actions/route
// handlers catch and map them via `instanceof`, never `error.message` string-matching.
export class NotFoundError extends Error {
  constructor(message = "The requested resource was not found.") {
    super(message);
    this.name = this.constructor.name;
  }
}

export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "You are not authorized to perform this action.") {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends Error {
  constructor(message = "The provided data is invalid.") {
    super(message);
    this.name = this.constructor.name;
  }
}
