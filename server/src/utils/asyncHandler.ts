import { Request, Response, NextFunction } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Wraps async route handlers to forward errors to the global error middleware.
 * Eliminates the need for try-catch in every controller method.
 */
export const asyncHandler =
  (fn: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
