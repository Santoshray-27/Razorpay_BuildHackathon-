/**
 * backend/src/validators/authValidator.js
 * Zod validation schemas for authentication endpoints.
 */

import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  role: z.enum(['merchant_admin', 'merchant_operator']).default('merchant_admin'),
  merchantId: z.string().min(2, 'merchantId must be at least 2 characters').trim().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required')
});

export function validateRequestBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message
          })),
          correlationId: req.correlationId
        }
      });
    }
    req.validatedBody = result.data;
    next();
  };
}
