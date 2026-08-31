/**
 * backend/src/observability/logger.js
 * Central structured logging with Winston. Formats logs as JSON in production
 * and pretty-printed colored output during development.
 * Automatically redacts sensitive FinTech fields (passwords, auth tokens, secret keys).
 */

import winston from 'winston';
import { env } from '../config/env.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'jwt',
  'authorization',
  'keysecret',
  'razorpaykeysecret',
  'webhooksecret',
  'geminiapikey',
  'cardnumber',
  'cvv',
  'pan'
]);

const redactFormat = winston.format((info) => {
  if (info && typeof info === 'object') {
    for (const key of Object.keys(info)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        info[key] = '[REDACTED]';
      }
    }
  }
  return info;
});

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const devFormat = printf(({ level, message, timestamp, correlationId, stack, ...meta }) => {
  const cid = correlationId ? `[Trace: ${correlationId}]` : '';
  const formattedMeta = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `${timestamp} ${level} ${cid} ${message} ${stack || ''} ${formattedMeta}`;
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    redactFormat(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    env.NODE_ENV === 'production' ? json() : combine(colorize(), devFormat)
  ),
  defaultMeta: { service: 'razorrecover-backend' },
  transports: [
    new winston.transports.Console()
  ]
});
