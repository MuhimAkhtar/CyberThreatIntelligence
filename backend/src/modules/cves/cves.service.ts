import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { CveQueryDto } from './dto/cve-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CvesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async findAll(query: CveQueryDto) {
    const where: Prisma.CveWhereInput = {};

    if (query.severity) where.severity = query.severity;
    if (query.keyword) where.description = { contains: query.keyword, mode: 'insensitive' };
    if (query.cvssMin || query.cvssMax) {
      where.cvssV3Score = {};
      if (query.cvssMin) where.cvssV3Score.gte = query.cvssMin;
      if (query.cvssMax) where.cvssV3Score.lte = query.cvssMax;
    }
    if (query.publishedAfter || query.publishedBefore) {
      where.publishedAt = {};
      if (query.publishedAfter) where.publishedAt.gte = new Date(query.publishedAfter);
      if (query.publishedBefore) where.publishedAt.lte = new Date(query.publishedBefore);
    }

    const cves = await this.prisma.cve.findMany({
      where,
      skip: query.skip || 0,
      take: query.take || 20,
      orderBy: { publishedAt: 'desc' },
    });
    const total = await this.prisma.cve.count({ where });

    return { data: cves, total };
  }

  async findOne(cveId: string) {
    const cve = await this.prisma.cve.findUnique({ where: { cveId } });
    if (!cve) throw new NotFoundException(`CVE ${cveId} not found`);
    return cve;
  }

  async getStats() {
    const counts = await this.prisma.cve.groupBy({
      by: ['severity'],
      _count: true,
    });
    return counts.reduce((acc, curr) => {
      acc[curr.severity] = curr._count;
      return acc;
    }, {} as Record<string, number>);
  }

  async search(keyword: string) {
    const esQuery = {
      multi_match: {
        query: keyword,
        fields: ['cveId', 'description'],
      }
    };
    return this.elasticsearchService.search('ctp-cves', esQuery);
  }
}
