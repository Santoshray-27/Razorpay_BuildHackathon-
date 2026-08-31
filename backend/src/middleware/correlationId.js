/**
 * backend/src/middleware/correlationId.js
 * Generates or propagates a unique correlation/trace ID on each incoming HTTP request.
 * Sets the 'x-correlation-id' header on the response.
 */

import { v4 as uuidv4 } from 'uuid';

export function correlationIdMiddleware(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || req.headers['x-request-id'] || `req_${uuidv4()}`;
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
}
