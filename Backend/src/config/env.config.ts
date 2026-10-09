import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/eduhub'),
  CLIENT_URL: z.string().default('http://localhost:5173'),

  // JWT configuration
  JWT_ACCESS_SECRET: z.string().default('eduhub_dev_access_secret_key_change_in_production_2026'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().default('eduhub_dev_refresh_secret_key_change_in_production_2026'),
  JWT_REFRESH_EXPIRY_DAYS: z.coerce.number().default(7),

  // Cookies & Security
  COOKIE_NAME: z.string().default('eduhub_refresh_token'),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),

  // Email / SMTP configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('EduHub <no-reply@eduhub.school>'),

  // Frontend URLs
  PASSWORD_RESET_URL: z.string().default('http://localhost:5173/reset-password'),
  VERIFICATION_URL: z.string().default('http://localhost:5173/verify-email'),

  // Initial Management Seed Credentials (used by setup script)
  INITIAL_MANAGEMENT_NAME: z.string().default('Principal Administrator'),
  INITIAL_MANAGEMENT_EMAIL: z.string().default('admin@eduhub.school'),
  INITIAL_MANAGEMENT_PASSWORD: z.string().default('EduHubAdmin@2026!'),
  INITIAL_MANAGEMENT_PHONE: z.string().default('+1234567890'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('[Config] Invalid environment configuration:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
export type EnvConfig = typeof env;
