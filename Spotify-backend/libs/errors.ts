export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export class AppError extends Error {
  public readonly status: number;
  public readonly type: ErrorType;
  public readonly isOperational: boolean;

  constructor(message: string, status: number, type: ErrorType, isOperational = true) {
    super(message);
    this.status = status;
    this.type = type;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, ErrorType.VALIDATION_ERROR);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, ErrorType.AUTHENTICATION_ERROR);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, ErrorType.AUTHORIZATION_ERROR);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, ErrorType.NOT_FOUND_ERROR);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, ErrorType.CONFLICT_ERROR);
  }
}
