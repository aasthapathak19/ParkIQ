import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.utils';
import { UnauthorizedError } from '../domain/errors';

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    // Phase 2: Check Redis Blacklist
    const redisClient = require('../infrastructure/redis/RedisClient').redisClient;
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return next(new UnauthorizedError('Token has been revoked'));
    }

    const payload = verifyAccessToken(token);
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};
