import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateArtifactDto } from './dto/create-artifact.dto';
import { ArtifactQueryDto } from './dto/artifact-query.dto';
import { CustodyEventDto } from './dto/custody-event.dto';
import { CustodyAction, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';

@Injectable()
export class ForensicsService {
  private readonly logger = new Logger(ForensicsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async registerArtifact(userId: string, dto: CreateArtifactDto) {
    const { caseId, artifactType, fileName, filePath, fileSizeBytes, sha256, sha1, md5, mimeType, description, tags } = dto;
    return this.prisma.$transaction(async (tx) => {
      const artifact = await tx.forensicArtifact.create({
        data: {
          caseId,
          artifactType,
          fileName,
          filePath,
          fileSizeBytes,
          sha256,
          sha1,
          md5,
          mimeType,
          description,
          tags,
          collectedBy: userId,
          custodyEvents: {
            create: {
              action: CustodyAction.COLLECTED,
              performedBy: userId,
              hashAtEvent: sha256,
              notes: 'Initial collection',
            }
          }
        },
      });
      return artifact;
    });
  }

  async listArtifacts(query: ArtifactQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ForensicArtifactWhereInput = {};
    if (query.caseId) {
      where.caseId = query.caseId;
    }
    if (query.artifactType) {
      where.artifactType = query.artifactType;
    }
    if (query.search) {
      where.OR = [
        { fileName: { contains: query.search, mode: 'insensitive' } },
        { sha256: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.forensicArtifact.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { custodyEvents: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.forensicArtifact.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getArtifactDetail(id: string) {
    const artifact = await this.prisma.forensicArtifact.findUnique({
      where: { id },
      include: {
        custodyEvents: { orderBy: { timestamp: 'asc' } },
        case: { select: { id: true, title: true, status: true } },
      },
    });

    if (!artifact) {
      throw new NotFoundException(`Artifact with ID ${id} not found`);
    }

    return artifact;
  }

  async verifyIntegrity(id: string, userId: string) {
    const artifact = await this.prisma.forensicArtifact.findUnique({
      where: { id },
    });

    if (!artifact) {
      throw new NotFoundException(`Artifact with ID ${id} not found`);
    }

    let computedHash: string | null = null;
    let verified = false;

    if (artifact.filePath && fs.existsSync(artifact.filePath)) {
      try {
        const fileBuffer = fs.readFileSync(artifact.filePath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        computedHash = hashSum.digest('hex');
        verified = computedHash === artifact.sha256;
      } catch (error: any) {
        this.logger.error(`Failed to read or hash file at ${artifact.filePath}`, error.stack);
      }
    }

    const action = verified ? CustodyAction.VERIFIED : CustodyAction.TAMPER_DETECTED;
    
    await this.prisma.custodyEvent.create({
      data: {
        artifactId: artifact.id,
        action,
        performedBy: userId,
        hashAtEvent: computedHash || '',
        notes: verified ? 'Integrity verified successfully' : 'Integrity check failed or file unavailable',
      },
    });

    return { verified, storedHash: artifact.sha256, computedHash };
  }

  async lookupVirusTotal(id: string) {
    const apiKey = this.configService.get<string>('VIRUSTOTAL_API_KEY');
    if (!apiKey) {
      return { skipped: true, reason: 'VIRUSTOTAL_API_KEY not configured' };
    }

    const artifact = await this.prisma.forensicArtifact.findUnique({
      where: { id },
      select: { id: true, sha256: true },
    });

    if (!artifact) {
      throw new NotFoundException(`Artifact with ID ${id} not found`);
    }

    try {
      const response = await fetch(`https://www.virustotal.com/api/v3/files/${artifact.sha256}`, {
        headers: {
          'x-apikey': apiKey,
        },
      });

      if (response.status === 404) {
        return this.prisma.forensicArtifact.update({
          where: { id },
          data: {
            vtDetectionRate: '0/0 (Not Found in VirusTotal)',
            vtPermalink: `https://www.virustotal.com/gui/file/${artifact.sha256}`,
            vtScannedAt: new Date(),
          },
        });
      }

      if (!response.ok) {
        throw new Error(`VirusTotal API returned ${response.status} ${response.statusText}`);
      }

      const vtData = await response.json();
      const stats = vtData.data?.attributes?.last_analysis_stats;
      const totalScans = (stats?.malicious || 0) + (stats?.undetected || 0) + (stats?.harmless || 0) + (stats?.suspicious || 0) + (stats?.timeout || 0);
      const vtDetectionRate = stats ? `${stats.malicious || 0}/${totalScans}` : 'N/A';
      const vtPermalink = vtData.data?.links?.self || `https://www.virustotal.com/gui/file/${artifact.sha256}`;

      const updated = await this.prisma.forensicArtifact.update({
        where: { id },
        data: {
          vtDetectionRate,
          vtPermalink,
          vtScannedAt: new Date(),
        },
      });
      return updated;
    } catch (error: any) {
      this.logger.error(`VirusTotal lookup failed for artifact ${id}: ${error.message}`);
      throw error;
    }
  }

  async recordCustodyEvent(artifactId: string, userId: string, dto: CustodyEventDto) {
    const artifact = await this.prisma.forensicArtifact.findUnique({ where: { id: artifactId } });
    if (!artifact) {
      throw new NotFoundException(`Artifact with ID ${artifactId} not found`);
    }

    return this.prisma.custodyEvent.create({
      data: {
        artifactId,
        action: dto.action,
        performedBy: userId,
        hashAtEvent: artifact.sha256,
        notes: dto.notes,
      },
    });
  }

  async getCustodyChain(artifactId: string) {
    return this.prisma.custodyEvent.findMany({
      where: { artifactId },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getArtifactsByCase(caseId: string) {
    return this.prisma.forensicArtifact.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
