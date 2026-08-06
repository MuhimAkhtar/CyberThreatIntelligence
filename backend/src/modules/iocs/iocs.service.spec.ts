import { Test, TestingModule } from '@nestjs/testing';
import { IocsService } from './iocs.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('IocsService', () => {
  let service: IocsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IocsService,
        { provide: PrismaService, useValue: { ioc: { findMany: jest.fn(), count: jest.fn(), groupBy: jest.fn() } } }
      ],
    }).compile();

    service = module.get<IocsService>(IocsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
