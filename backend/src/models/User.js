/**
 * backend/src/models/User.js
 * User model representing merchant admins and operators with role-based access.
 */

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false // Never return passwordHash in queries by default
    },
    role: {
      type: String,
      enum: ['merchant_admin', 'merchant_operator'],
      default: 'merchant_admin',
      required: true
    },
    merchantId: {
      type: String,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model('User', userSchema);
