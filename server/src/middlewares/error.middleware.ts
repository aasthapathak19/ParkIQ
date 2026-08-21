import { Request, Response, NextFunction } from 'express';
import { DomainError, ValidationError } from '../domain/errors';
import { ApiResponse } from '../utils/ApiResponse';
import { logger } from '../config/logger';
import { env } from '../config/env';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const requestId = req.requestId ?? 'unknown';

  // Domain errors — operational, expected
  if (err instanceof DomainError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId, url: req.url, method: req.method }, 'Server error');
    } else {
      logger.warn({ errorCode: err.errorCode, requestId, url: req.url }, err.message);
    }

    const details = err instanceof ValidationError ? err.details : undefined;

    res.status(err.statusCode).json(
      ApiResponse.error(err.message, err.errorCode, details, requestId),
    );
    return;
  }

  // Unknown / programmer errors
  logger.error({ err, requestId, url: req.url, method: req.method }, 'Unhandled error');

  const message =
    env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message;

  res.status(500).json(ApiResponse.error(message, 'INTERNAL_ERROR', undefined, requestId));
};
