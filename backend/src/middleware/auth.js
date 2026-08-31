/**
 * backend/src/middleware/auth.js
 * JWT authentication, role enforcement, and merchant tenant data isolation middleware.
 */

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

/**
 * Verifies Bearer JWT in Authorization header and attaches sanitized user to req.user.
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is missing or malformed',
        correlationId: req.correlationId
      }
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // Fetch active user
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User account no longer exists',
          correlationId: req.correlationId
        }
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      merchantId: user.merchantId
    };

    next();
  } catch (error) {
    const isExpired = error.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      error: {
        code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        message: isExpired ? 'Authentication token has expired' : 'Invalid authentication token',
        correlationId: req.correlationId
      }
    });
  }
}

/**
 * Role-Based Access Control (RBAC) guard.
 * @param {string[]} allowedRoles
 */
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          correlationId: req.correlationId
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
          correlationId: req.correlationId
        }
      });
    }

    next();
  };
}

/**
 * Merchant Data Isolation Helper
 * Injects { merchantId: req.user.merchantId } to ensure queries cannot leak across merchants.
 */
export function getMerchantFilter(req, customFilters = {}) {
  if (!req.user || !req.user.merchantId) {
    throw new Error('Merchant context missing from request');
  }
  return {
    ...customFilters,
    merchantId: req.user.merchantId
  };
}
