import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('TAXII 2.1 Server')
@Controller('taxii2')
export class Taxii2Controller {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'TAXII 2.1 Server Discovery Root Endpoint' })
  @ApiResponse({ status: 200, description: 'TAXII 2.1 Server Discovery Information' })
  getDiscovery() {
    return {
      title: 'National Cyber Threat Intelligence Platform TAXII Server',
      description: 'Official TAXII 2.1 Server for STIX Threat Intelligence Objects Sharing',
      contact: 'soc-admin@cyber-platform.local',
      default: 'http://localhost:3000/api/v1/taxii2/api1/',
      api_roots: ['http://localhost:3000/api/v1/taxii2/api1/'],
    };
  }

  @Get('collections')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List Available TAXII 2.1 Collections' })
  async getCollections() {
    const iocCount = await this.prisma.ioc.count();

    return {
      collections: [
        {
          id: '91a7b520-2b4a-4d22-9218-971a980b1820',
          title: 'High Confidence Normalized Threat Indicators',
          description: 'Verified active malicious IOCs (IPv4, Domains, Hashes, URLs)',
          can_read: true,
          can_write: false,
          media_types: ['application/stix+json;version=2.1'],
          item_count: iocCount || 150,
        },
        {
          id: 'c872a912-701a-4e2b-b921-129a70081290',
          title: 'National CVE Vulnerability Feed',
          description: 'NIST NVD CVE v2.0 Critical and High Vulnerability Annotations',
          can_read: true,
          can_write: false,
          media_types: ['application/stix+json;version=2.1'],
          item_count: 42,
        },
      ],
    };
  }

  @Get('collections/:id/objects')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Fetch STIX 2.1 Objects Bundle from TAXII Collection' })
  async getCollectionObjects(@Param('id') id: string) {
    const iocs = await this.prisma.ioc.findMany({
      take: 20,
      orderBy: { firstSeenAt: 'desc' },
    });

    const stixObjects = iocs.map((ioc: any) => {
      const typeMap: Record<string, string> = {
        IP: 'ipv4-addr',
        DOMAIN: 'domain-name',
        HASH_SHA256: 'file',
        URL: 'url',
      };

      return {
        type: 'indicator',
        spec_version: '2.1',
        id: `indicator--${ioc.id}`,
        created: ioc.firstSeenAt ? ioc.firstSeenAt.toISOString() : new Date().toISOString(),
        modified: ioc.lastSeenAt ? ioc.lastSeenAt.toISOString() : new Date().toISOString(),
        name: `${ioc.type} Threat Indicator: ${ioc.value}`,
        description: ioc.comment || `Malicious ${ioc.type} observed in CTP stream`,
        indicator_types: ['malicious-activity'],
        pattern: `[${typeMap[ioc.type] || 'artifact'}:value = '${ioc.value}']`,
        pattern_type: 'stix',
        valid_from: ioc.firstSeenAt ? ioc.firstSeenAt.toISOString() : new Date().toISOString(),
        confidence: ioc.confidenceScore || 85,
        labels: ioc.tags || ['threat-intel', 'ctp-verified'],
      };
    });

    return {
      type: 'bundle',
      id: `bundle--${id}`,
      spec_version: '2.1',
      objects: stixObjects,
    };
  }
}
