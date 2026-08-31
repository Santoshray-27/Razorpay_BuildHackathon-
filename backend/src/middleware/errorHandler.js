/**
 * backend/src/middleware/errorHandler.js
 * Centralized error handler and 404 handler for Express.
 * Standardizes API error responses and logs errors with correlation IDs.
 */

import { logger } from '../observability/logger.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Resource not found at ${req.originalUrl}`,
      correlationId: req.correlationId
    }
  });
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const correlationId = req.correlationId || 'unknown';

  logger.error(`API Error: ${err.message}`, {
    correlationId,
    statusCode,
    path: req.originalUrl,
    method: req.method,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
      message: err.message || 'An unexpected error occurred',
      correlationId,
      ...(env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}
