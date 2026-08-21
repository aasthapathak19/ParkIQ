export class DomainError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, errorCode: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      404,
      'NOT_FOUND',
    );
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ValidationError extends DomainError {
  public readonly details: Array<{ field: string; message: string }>;

  constructor(details: Array<{ field: string; message: string }>) {
    super('Validation failed', 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class SlotUnavailableError extends DomainError {
  constructor(slotId: string) {
    super(`Slot '${slotId}' is not available for the requested time period`, 409, 'SLOT_UNAVAILABLE');
  }
}

export class BookingConflictError extends DomainError {
  constructor() {
    super('A booking already exists for this slot and time period', 409, 'BOOKING_CONFLICT');
  }
}

export class RateLimitError extends DomainError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class InternalError extends DomainError {
  constructor(message = 'An unexpected error occurred') {
    super(message, 500, 'INTERNAL_ERROR');
  }
}
