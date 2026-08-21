import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types/common.types';

export const signAccessToken = (payload: JwtPayload): string => {
  const opts = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: 'parkiq-api',
    audience: 'parkiq-client',
  } as unknown as SignOptions;
  return jwt.sign(payload as object, env.JWT_ACCESS_SECRET, opts);
};

export const signRefreshToken = (payload: JwtPayload): string => {
  const opts = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'parkiq-api',
  } as unknown as SignOptions;
  return jwt.sign(payload as object, env.JWT_REFRESH_SECRET, opts);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'parkiq-api',
    audience: 'parkiq-client',
  }) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'parkiq-api',
  }) as JwtPayload;
};
