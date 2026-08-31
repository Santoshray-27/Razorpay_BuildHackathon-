/**
 * backend/src/config/db.js
 * Manages Mongoose MongoDB database lifecycle and connection state.
 * Gracefully shuts down and reports connection readiness for health checks.
 */

import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../observability/logger.js';

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });

    isConnected = true;
    logger.info(`📦 MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection runtime error', { error: err.message });
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });

    return conn;
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB', { error: error.message, uri: env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') });
    throw error;
  }
}

export function getDatabaseStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateCode = mongoose.connection.readyState;
  return {
    status: stateCode === 1 ? 'healthy' : 'unhealthy',
    readyState: states[stateCode] || 'unknown',
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null
  };
}

export async function disconnectDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB connection closed.');
  }
}
