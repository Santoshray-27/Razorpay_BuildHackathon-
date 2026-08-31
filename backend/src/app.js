/**
 * backend/src/app.js
 * Express application configuration, security middleware, and operational health routes.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { logger } from './observability/logger.js';
import { correlationIdMiddleware } from './middleware/correlationId.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { getDatabaseStatus } from './config/db.js';
import { getRedisStatus } from './config/redis.js';

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: env.NODE_ENV === 'production' 
    ? [/^https?:\/\/localhost:\d+$/] 
    : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

// Correlation ID Tracking
app.use(correlationIdMiddleware);

// HTTP Access Logging
const morganFormat = ':method :url :status :res[content-length] - :response-time ms';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.debug(message.trim())
  }
}));

// Global Rate Limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again after 15 minutes.'
    }
  }
});
app.use(generalLimiter);

// Express JSON body parser
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * Liveness Probe - Fast check for process liveness
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'razorrecover-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    correlationId: req.correlationId
  });
});

/**
 * Readiness Probe - Checks DB & Redis dependencies
 */
app.get('/api/ready', async (req, res) => {
  const dbStatus = getDatabaseStatus();
  const redisStatus = await getRedisStatus();

  const isReady = dbStatus.status === 'healthy' && redisStatus.status === 'healthy';

  const statusCode = isReady ? 200 : 503;
  res.status(statusCode).json({
    status: isReady ? 'ready' : 'degraded',
    service: 'razorrecover-backend',
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId,
    dependencies: {
      mongodb: dbStatus,
      redis: redisStatus
    }
  });
});

// Fallback 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
