import { Test, TestingModule } from '@nestjs/testing';
import { FeedSchedulerService } from './feed-scheduler.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedSyncService } from './feed-sync.service';

import { RedisLockService } from '../redis/redis-lock.service';

const mockRedisLockService = {
  acquireLock: jest.fn().mockResolvedValue(true),
  releaseLock: jest.fn().mockResolvedValue(true),
};

const mockPrismaService = {
  threatFeed: {
    findMany: jest.fn(),
  },
};

const mockFeedSyncService = {
  syncFeed: jest.fn().mockResolvedValue({ status: 'SUCCESS' }),
};

describe('FeedSchedulerService', () => {
  let service: FeedSchedulerService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedSchedulerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(true),
          },
        },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FeedSyncService, useValue: mockFeedSyncService },
        { provide: RedisLockService, useValue: mockRedisLockService },
      ],
    }).compile();

    service = module.get<FeedSchedulerService>(FeedSchedulerService);
  });

  it('should skip cron if feeds.syncEnabled is false', async () => {
    const disabledConfigService = { get: jest.fn().mockReturnValue(false) };
    const disabledModule = await Test.createTestingModule({
      providers: [
        FeedSchedulerService,
        { provide: ConfigService, useValue: disabledConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FeedSyncService, useValue: mockFeedSyncService },
        { provide: RedisLockService, useValue: mockRedisLockService },
      ],
    }).compile();

    const disabledService = disabledModule.get<FeedSchedulerService>(FeedSchedulerService);
    await disabledService.handleCron();

    expect(mockPrismaService.threatFeed.findMany).not.toHaveBeenCalled();
  });

  it('should trigger sync for due feeds and guard against concurrent syncs', async () => {
    const mockFeeds = [
      {
        id: 'feed-1',
        name: 'OTX',
        enabled: true,
        fetchIntervalMinutes: 60,
        lastSyncAt: new Date(Date.now() - 120 * 60 * 1000), // 2 hours ago
      },
    ];

    mockPrismaService.threatFeed.findMany.mockResolvedValueOnce(mockFeeds);

    await service.handleCron();

    expect(mockFeedSyncService.syncFeed).toHaveBeenCalledWith('feed-1');
  });
});
