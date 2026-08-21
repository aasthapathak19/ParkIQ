import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z.string().regex(/^\+?[\d\s-]{10,15}$/, 'Invalid phone number').optional(),
  role: z.enum(['customer', 'owner']).default('customer'),
});

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});
