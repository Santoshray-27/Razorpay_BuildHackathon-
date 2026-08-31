/**
 * backend/src/worker.js
 * Standalone Worker process entry point.
 * Run independently via: npm run worker
 */

import { connectDB, disconnectDB } from './config/db.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { startRecoveryWorker } from './jobs/recoveryWorker.js';
import { logger } from './observability/logger.js';

let worker;

async function bootstrapWorker() {
  try {
    logger.info('🚀 Starting RazorRecover Background Worker Process...');

    await connectDB();
    await connectRedis();

    worker = startRecoveryWorker();
    logger.info('✨ Worker process fully initialized and active.');
  } catch (error) {
    logger.error('💥 Fatal worker startup error', { error: error.message });
    process.exit(1);
  }
}

async function shutdownWorker(signal) {
  logger.info(`🛑 Received ${signal}. Shutting down worker gracefully...`);
  if (worker) {
    await worker.close();
  }
  await disconnectDB();
  await disconnectRedis();
  logger.info('Worker process exited cleanly.');
  process.exit(0);
}

process.on('SIGTERM', () => shutdownWorker('SIGTERM'));
process.on('SIGINT', () => shutdownWorker('SIGINT'));

bootstrapWorker();
