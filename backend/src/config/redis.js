/**
 * backend/src/config/redis.js
 * Manages IORedis client connection for BullMQ job queue and operational cache.
 * Exposes connection status for health/ready probes with bounded reconnect logging.
 */

import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../observability/logger.js';

let redisClient = null;
let isRedisReady = false;
let hasLoggedFailure = false;

export function getRedisClient() {
  if (!redisClient) {
    const isTls = env.REDIS_URL.startsWith('rediss://');
    
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: true,
      lazyConnect: true,
      tls: isTls ? { rejectUnauthorized: false } : undefined,
      retryStrategy(times) {
        if (times > 20) {
          // Bounded maximum retry delay
          return 10000;
        }
        return Math.min(times * 500, 5000);
      }
    });

    redisClient.on('connect', () => {
      logger.info('⚡ Redis connection initiating...');
    });

    redisClient.on('ready', () => {
      isRedisReady = true;
      hasLoggedFailure = false;
      logger.info('⚡ Redis client ready and connected.');
    });

    redisClient.on('error', (err) => {
      isRedisReady = false;
      if (!hasLoggedFailure) {
        logger.warn('Redis unavailable or connection failed', { error: err.message, url: env.REDIS_URL });
        hasLoggedFailure = true;
      }
    });

    redisClient.on('close', () => {
      isRedisReady = false;
    });
  }

  return redisClient;
}

export async function connectRedis() {
  const client = getRedisClient();
  if (client.status === 'ready') return client;
  
  try {
    await client.connect();
    isRedisReady = true;
    return client;
  } catch (error) {
    isRedisReady = false;
    if (!hasLoggedFailure) {
      logger.warn('Initial Redis connection attempt failed', { error: error.message });
      hasLoggedFailure = true;
    }
    throw error;
  }
}

export async function getRedisStatus() {
  if (!redisClient || !isRedisReady) {
    return { status: 'unhealthy', connected: false, latencyMs: null };
  }

  try {
    const start = Date.now();
    const pingResponse = await redisClient.ping();
    const latencyMs = Date.now() - start;
    return {
      status: pingResponse === 'PONG' ? 'healthy' : 'unhealthy',
      connected: true,
      latencyMs
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message
    };
  }
}

export async function disconnectRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch (_) {
      redisClient.disconnect();
    }
    redisClient = null;
    isRedisReady = false;
    logger.info('Redis connection closed.');
  }
}
