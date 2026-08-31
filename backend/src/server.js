/**
 * backend/src/server.js
 * Main backend server entry point. Connects to database and cache, then starts listening.
 */

import app from './app.js';
import { env } from './config/env.js';
import { logger } from './observability/logger.js';
import { connectDB, disconnectDB } from './config/db.js';
import { connectRedis, disconnectRedis } from './config/redis.js';

let server;

async function startServer() {
  try {
    logger.info('🚀 Initializing RazorRecover Backend Services...');

    // 1. Connect MongoDB
    try {
      await connectDB();
    } catch (dbErr) {
      logger.warn('⚠️ MongoDB connection deferred or failed. Starting server in degraded mode for diagnostic endpoints.');
    }

    // 2. Connect Redis
    try {
      await connectRedis();
    } catch (redisErr) {
      logger.warn('⚠️ Redis connection deferred or failed. Starting server in degraded mode for diagnostic endpoints.');
    }

    // 3. Start Express HTTP Server
    server = app.listen(env.PORT, () => {
      logger.info(`✨ RazorRecover Backend Server running on port ${env.PORT} in [${env.NODE_ENV}] mode`);
      logger.info(`🔗 Health endpoint: http://localhost:${env.PORT}/api/health`);
      logger.info(`🔗 Ready endpoint:  http://localhost:${env.PORT}/api/ready`);
    });

  } catch (error) {
    logger.error('💥 Fatal error starting server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Graceful Shutdown
async function handleShutdown(signal) {
  logger.info(`🛑 Received ${signal}. Initiating graceful shutdown...`);
  
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDB();
      await disconnectRedis();
      logger.info('All connections terminated. Exiting process.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

startServer();
