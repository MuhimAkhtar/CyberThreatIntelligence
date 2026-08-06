import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedSyncService } from './feed-sync.service';
import { RedisLockService } from '../redis/redis-lock.service';

@Injectable()
export class FeedSchedulerService {
  private readonly logger = new Logger(FeedSchedulerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly feedSyncService: FeedSyncService,
    private readonly redisLockService: RedisLockService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    if (!this.configService.get<boolean>('feeds.syncEnabled')) {
      return;
    }

    const feeds = await this.prisma.threatFeed.findMany({
      where: { enabled: true },
    });

    const now = new Date();

    for (const feed of feeds) {
      const lastSync = feed.lastSyncAt ? feed.lastSyncAt.getTime() : 0;
      const intervalMs = feed.fetchIntervalMinutes * 60 * 1000;

      if (now.getTime() - lastSync >= intervalMs) {
        const lockKey = `lock:feed-sync:${feed.id}`;
        const lockId = await this.redisLockService.acquireLock(lockKey, intervalMs);

        if (!lockId) {
          this.logger.debug(`Skipping feed sync for [${feed.name}] — lock held by another process/node.`);
          continue;
        }

        this.feedSyncService.syncFeed(feed.id)
          .catch(err => this.logger.error(`Error running scheduled sync for ${feed.id}`, err))
          .finally(async () => {
            await this.redisLockService.releaseLock(lockKey, lockId);
          });
      }
    }
  }
}
