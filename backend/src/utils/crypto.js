/**
 * backend/src/utils/crypto.js
 * Cryptographic utility functions for webhook HMAC-SHA256 signature verification
 * and stable payload hashing. Uses timing-safe equality checks.
 */

import crypto from 'crypto';

/**
 * Verifies Razorpay HMAC-SHA256 webhook signature using raw body buffer.
 * @param {Buffer|string} rawBody - Raw unmodified request body
 * @param {string} signature - x-razorpay-signature header from Razorpay
 * @param {string} secret - Webhook secret from Razorpay Dashboard
 * @returns {boolean}
 */
export function verifyWebhookSignature(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) {
    return false;
  }

  try {
    const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyString)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (error) {
    return false;
  }
}

/**
 * Computes a stable SHA-256 hash of a payload for deduplicating events lacking an explicit event ID.
 * @param {object|string} payload
 * @returns {string} hex hash
 */
export function computePayloadHash(payload) {
  const content = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHash('sha256').update(content).digest('hex');
}
