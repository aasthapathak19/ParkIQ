import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../domain/errors';

export const notFound = (_req: Request, _res: Response, next: NextFunction): void => {
  next(new NotFoundError('Route'));
};
