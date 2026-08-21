import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

/** Generate a cryptographically secure random token */
export const generateSecureToken = (bytes = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

/** Hash a token for safe DB storage */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/** Hash a password with bcrypt */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
};

/** Compare a plain password against a bcrypt hash */
export const comparePassword = async (plain: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(plain, hash);
};

/** Generate a short, readable OTP */
export const generateOTP = (length = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
};
