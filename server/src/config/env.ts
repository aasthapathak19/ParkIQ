import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  API_VERSION: z.string().default('v1'),
  APP_URL: z.string().url(),
  CLIENT_URL: z.string().url(),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB_NAME: z.string().default('parkiq_ai'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  REDIS_URI: z.string().url().optional().default('redis://localhost:6379'),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  BCRYPT_ROUNDS: z.string().default('12').transform(Number),

  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_MAX: z.string().default('300').transform(Number),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FORMAT: z.enum(['pretty', 'json']).default('json'),

  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  CACHE_PROVIDER: z.enum(['memory', 'redis']).default('memory'),
  QUEUE_PROVIDER: z.enum(['memory', 'bullmq']).default('memory'),
  PAYMENT_GATEWAY: z.enum(['mock', 'stripe', 'razorpay']).default('mock'),
  EMAIL_PROVIDER: z.enum(['none', 'nodemailer', 'sendgrid']).default('none'),
  VISION_PROVIDER: z.enum(['mock', 'yolo']).default('mock'),
  OCR_PROVIDER: z.enum(['mock', 'tesseract']).default('mock'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
