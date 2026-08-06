import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

@Injectable()
export class RedisLockService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisLockService.name);
  private readonly redisClient: Redis;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    this.redisClient = new Redis({
      host,
      port,
      lazyConnect: false,
      maxRetriesPerRequest: 3,
    });

    this.redisClient.on('connect', () => {
      this.logger.log(`Connected to Redis Lock Provider at ${host}:${port}`);
    });

    this.redisClient.on('error', (err) => {
      this.logger.error(`Redis Lock Provider Connection Error: ${err.message}`);
    });
  }

  /**
   * Acquire a single-instance Redis distributed lock using atomic SET NX PX.
   * @param lockKey Key name for lock (e.g. lock:feed-sync:123)
   * @param ttlMs Time-to-live in milliseconds before automatic expiration
   * @returns Lock ID string if acquired, or null if lock is already held
   */
  async acquireLock(lockKey: string, ttlMs: number = 30000): Promise<string | null> {
    const lockId = randomUUID();
    try {
      const result = await this.redisClient.set(lockKey, lockId, 'PX', ttlMs, 'NX');
      if (result === 'OK') {
        this.logger.debug(`Acquired lock [${lockKey}] with lockId [${lockId}] for ${ttlMs}ms`);
        return lockId;
      }
      this.logger.debug(`Failed to acquire lock [${lockKey}] - already held`);
      return null;
    } catch (error: any) {
      this.logger.error(`Error acquiring lock [${lockKey}]: ${error?.message || error}`);
      return null;
    }
  }

  /**
   * Safe atomic release of Redis lock using Lua Script.
   * @param lockKey Key name for lock
   * @param lockId Lock ID returned during acquisition
   * @returns true if released, false if lock was not held or already expired
   */
  async releaseLock(lockKey: string, lockId: string): Promise<boolean> {
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    try {
      const result = await this.redisClient.eval(luaScript, 1, lockKey, lockId);
      const released = result === 1;
      if (released) {
        this.logger.debug(`Released lock [${lockKey}] with lockId [${lockId}]`);
      } else {
        this.logger.warn(`Could not release lock [${lockKey}] - lockId mismatch or expired`);
      }
      return released;
    } catch (error: any) {
      this.logger.error(`Error releasing lock [${lockKey}]: ${error?.message || error}`);
      return false;
    }
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }
}
