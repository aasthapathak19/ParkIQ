import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../domain/errors';
import { UserRole } from '../types/common.types';

/**
 * Role-based access control middleware factory.
 * Usage: authorize('admin') or authorize('owner', 'admin')
 */
export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Role '${req.user.role}' is not authorized for this action`,
      );
    }

    next();
  };
