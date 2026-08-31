/**
 * backend/src/services/authService.js
 * Business logic for user registration, password verification, JWT generation, and profile retrieval.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

export async function registerUser({ name, email, password, role = 'merchant_admin', merchantId }) {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('A user with this email address already exists');
    error.statusCode = 409;
    error.code = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  // Assign or generate unique merchant ID
  const effectiveMerchantId = merchantId || `merch_${uuidv4().substring(0, 8)}`;

  // Hash password securely (10 salt rounds)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    merchantId: effectiveMerchantId
  });

  const token = jwt.sign(
    { userId: user._id.toString(), role: user.role, merchantId: user.merchantId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      merchantId: user.merchantId,
      createdAt: user.createdAt
    }
  };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const token = jwt.sign(
    { userId: user._id.toString(), role: user.role, merchantId: user.merchantId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      merchantId: user.merchantId,
      createdAt: user.createdAt
    }
  };
}

export async function getUserProfile(userId) {
  const user = await User.findById(userId).lean();
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    merchantId: user.merchantId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
