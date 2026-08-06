import { Test, TestingModule } from '@nestjs/testing';
import { FeedsService } from './feeds.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('FeedsService', () => {
  let service: FeedsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedsService,
        { provide: PrismaService, useValue: { threatFeed: { findMany: jest.fn(), count: jest.fn() } } }
      ],
    }).compile();

    service = module.get<FeedsService>(FeedsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
