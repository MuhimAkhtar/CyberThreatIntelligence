import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IocQueryDto } from './dto/ioc-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class IocsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: IocQueryDto) {
    const where: Prisma.IocWhereInput = {};

    if (query.value) where.value = { contains: query.value, mode: 'insensitive' };
    if (query.type) where.type = query.type;
    if (query.feedId) where.feedId = query.feedId;
    
    if (query.minConfidence || query.maxConfidence) {
      where.confidenceScore = {};
      if (query.minConfidence) where.confidenceScore.gte = query.minConfidence;
      if (query.maxConfidence) where.confidenceScore.lte = query.maxConfidence;
    }

    if (query.firstSeenAfter || query.firstSeenBefore) {
      where.firstSeenAt = {};
      if (query.firstSeenAfter) where.firstSeenAt.gte = new Date(query.firstSeenAfter);
      if (query.firstSeenBefore) where.firstSeenAt.lte = new Date(query.firstSeenBefore);
    }

    const iocs = await this.prisma.ioc.findMany({
      where,
      skip: query.skip || 0,
      take: query.take || 20,
      orderBy: { firstSeenAt: 'desc' },
      include: { feed: { select: { name: true, type: true } } }
    });
    const total = await this.prisma.ioc.count({ where });

    return { data: iocs, total };
  }

  async findOne(id: string) {
    const ioc = await this.prisma.ioc.findUnique({
      where: { id },
      include: { feed: true }
    });
    if (!ioc) throw new NotFoundException(`IOC ${id} not found`);
    return ioc;
  }

  async getStats() {
    const byType = await this.prisma.ioc.groupBy({ by: ['type'], _count: true });
    const byFeed = await this.prisma.ioc.groupBy({ by: ['feedId'], _count: true });

    return {
      byType: byType.reduce((acc, curr) => { acc[curr.type] = curr._count; return acc; }, {} as Record<string, number>),
      byFeed: byFeed.reduce((acc, curr) => { acc[curr.feedId] = curr._count; return acc; }, {} as Record<string, number>),
    };
  }
}
