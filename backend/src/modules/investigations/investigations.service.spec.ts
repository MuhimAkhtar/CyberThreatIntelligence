import { Test, TestingModule } from '@nestjs/testing';
import { InvestigationsService } from './investigations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CaseStatus, CasePriority } from '@prisma/client';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('InvestigationsService', () => {
  let service: InvestigationsService;
  let prisma: PrismaService;

  const mockCase = {
    id: 'case-001',
    title: 'Ransomware Outbreak Investigation',
    description: 'Investigating suspicious WannaCry hashes',
    priority: CasePriority.HIGH,
    status: CaseStatus.OPEN,
    createdById: 'user-001',
    assignedToUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    closedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestigationsService,
        {
          provide: PrismaService,
          useValue: {
            investigationCase: {
              create: jest.fn().mockResolvedValue(mockCase),
              findMany: jest.fn().mockResolvedValue([mockCase]),
              count: jest.fn().mockResolvedValue(1),
              findUnique: jest.fn().mockResolvedValue(mockCase),
              update: jest.fn().mockImplementation(({ data }) =>
                Promise.resolve({ ...mockCase, ...data }),
              ),
            },
            caseNote: {
              create: jest.fn().mockResolvedValue({
                id: 'note-001',
                caseId: 'case-001',
                authorUserId: 'user-001',
                content: 'Initial analysis note',
                createdAt: new Date(),
              }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<InvestigationsService>(InvestigationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should allow valid case transition (OPEN -> IN_PROGRESS)', async () => {
    const updated = await service.updateStatus('case-001', CaseStatus.IN_PROGRESS);
    expect(updated.status).toBe(CaseStatus.IN_PROGRESS);
  });

  it('should reject invalid case transition (CLOSED -> OPEN) with 409 ConflictException', async () => {
    jest.spyOn(prisma.investigationCase, 'findUnique').mockResolvedValueOnce({
      ...mockCase,
      status: CaseStatus.CLOSED,
    } as any);

    await expect(service.updateStatus('case-001', CaseStatus.OPEN)).rejects.toThrow(
      ConflictException,
    );
  });

  it('should add note to case with author attribution', async () => {
    const note = await service.addNote('case-001', 'user-001', 'New investigative evidence');
    expect(note.id).toBe('note-001');
    expect(note.authorUserId).toBe('user-001');
  });
});
