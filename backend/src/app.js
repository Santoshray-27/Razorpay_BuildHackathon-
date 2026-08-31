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

import webhookRoutes from './routes/webhookRoutes.js';
import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import recoveryRoutes from './routes/recoveryRoutes.js';

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

// Webhook Rate Limiter (Protects endpoint while allowing legitimate webhook bursts)
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
      message: 'Webhook burst threshold reached.'
    }
  }
});

// CRITICAL FINTECH RULE: Mount Webhooks BEFORE global express.json()
app.use('/api/webhooks', webhookLimiter, webhookRoutes);

// Rate limiter for Auth endpoints (protection against brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again in 15 minutes.'
    }
  }
});

// General Rate Limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
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

// Express JSON body parser for regular application routes
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * Operational Health Probes
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

/**
 * Application API Routes
 */
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/recovery', recoveryRoutes);

// Fallback 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
