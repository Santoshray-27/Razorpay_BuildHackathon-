/**
 * backend/src/config/env.js
 * Validates and exposes typed environment configuration using Zod.
 * Ensures the server never starts with invalid or missing required variables.
 */

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  GEMINI_API_KEY: z.string().optional().default(''),
  AI_ENABLED: z.coerce.boolean().default(true),
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),
  HIGH_VALUE_THRESHOLD_PAISE: z.coerce.number().default(1000000), // ₹10,000 in paise
  DEFAULT_EXECUTION_MODE: z.enum(['RAZORPAY_TEST', 'MOCK_DEMO', 'SIMULATION']).default('MOCK_DEMO'),
  DEMO_COMPRESSION_ENABLED: z.coerce.boolean().default(true)
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Environment validation failed:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
