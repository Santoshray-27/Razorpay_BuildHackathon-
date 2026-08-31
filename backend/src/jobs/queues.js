/**
 * backend/src/jobs/queues.js
 * BullMQ Queue definitions for delayed, reliable recovery action processing.
 */

import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { logger } from '../observability/logger.js';

let recoveryActionsQueue = null;

export function getRecoveryActionsQueue() {
  if (!recoveryActionsQueue) {
    const redisClient = getRedisClient();

    recoveryActionsQueue = new Queue('recovery-actions', {
      connection: redisClient,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 100, // Retain last 100 completed jobs for audit inspection
        removeOnFail: 200      // Retain last 200 failed jobs for debugging
      }
    });

    logger.info('📦 BullMQ Queue [recovery-actions] initialized.');
  }

  return recoveryActionsQueue;
}
