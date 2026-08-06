import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFeedDto } from './dto/create-feed.dto';
import { UpdateFeedDto } from './dto/update-feed.dto';

@Injectable()
export class FeedsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(skip?: number, take?: number) {
    const feeds = await this.prisma.threatFeed.findMany({
      skip: skip || 0,
      take: take || 20,
      orderBy: { createdAt: 'desc' },
    });
    const total = await this.prisma.threatFeed.count();
    return { data: feeds, total };
  }

  async findOne(id: string) {
    const feed = await this.prisma.threatFeed.findUnique({
      where: { id },
      include: {
        _count: {
          select: { syncLogs: true },
        },
      },
    });
    if (!feed) {
      throw new NotFoundException(`Feed ${id} not found`);
    }
    return feed;
  }

  async create(dto: CreateFeedDto) {
    return this.prisma.threatFeed.create({
      data: dto as any,
    });
  }

  async update(id: string, dto: UpdateFeedDto) {
    await this.findOne(id);
    return this.prisma.threatFeed.update({
      where: { id },
      data: dto as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.feedSyncLog.deleteMany({ where: { feedId: id } });
    return this.prisma.threatFeed.delete({ where: { id } });
  }

  async getSyncLogs(feedId: string, skip?: number, take?: number) {
    const logs = await this.prisma.feedSyncLog.findMany({
      where: { feedId },
      skip: skip || 0,
      take: take || 20,
      orderBy: { startedAt: 'desc' },
    });
    const total = await this.prisma.feedSyncLog.count({ where: { feedId } });
    return { data: logs, total };
  }
}
