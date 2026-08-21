import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../domain/errors';

type ValidateTarget = 'body' | 'query' | 'params';

/**
 * Zod validation middleware factory.
 * Usage: validate(CreateBookingSchema) or validate(SearchSchema, 'query')
 */
export const validate =
  (schema: ZodSchema, target: ValidateTarget = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details = (result.error as ZodError).errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError(details);
    }

    req[target] = result.data;
    next();
  };
