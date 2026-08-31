/**
 * backend/src/validators/webhookValidator.js
 * Zod schemas for validating incoming Razorpay webhook payloads and test fixtures.
 */

import { z } from 'zod';

export const razorpayWebhookSchema = z.object({
  entity: z.literal('event').optional().default('event'),
  account_id: z.string().optional(),
  event: z.string().min(1, 'Webhook event name is required'),
  contains: z.array(z.string()).optional().default([]),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string().min(1, 'Payment ID is required'),
        entity: z.literal('payment').optional().default('payment'),
        amount: z.number().int().min(1, 'Amount must be positive in paise'),
        currency: z.string().default('INR'),
        status: z.string(),
        order_id: z.string().nullable().optional(),
        method: z.string().optional().default('card'),
        error_code: z.string().nullable().optional(),
        error_description: z.string().nullable().optional(),
        error_reason: z.string().nullable().optional(),
        customer_id: z.string().nullable().optional(),
        email: z.string().nullable().optional(),
        contact: z.string().nullable().optional(),
        created_at: z.number().optional()
      }).passthrough()
    }).passthrough()
  }).passthrough(),
  created_at: z.number().optional()
}).passthrough();

export const devFixtureSchema = z.object({
  merchantId: z.string().default('merch_default'),
  event_id: z.string().optional(),
  payment_id: z.string().min(1, 'payment_id is required'),
  customer_id: z.string().optional(),
  customer_name: z.string().optional(),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().optional(),
  amount: z.number().int().min(1, 'amount must be in paise (e.g. 499900)'),
  currency: z.string().default('INR'),
  status: z.enum(['failed', 'authorized', 'captured']).default('failed'),
  failure_reason: z.string().default('insufficient_funds'),
  payment_method: z.enum(['card', 'upi', 'netbanking', 'wallet']).default('card'),
  execution_mode: z.enum(['RAZORPAY_TEST', 'MOCK_DEMO', 'SIMULATION']).default('MOCK_DEMO')
});
