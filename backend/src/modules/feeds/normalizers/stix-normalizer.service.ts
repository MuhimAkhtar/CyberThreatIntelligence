import { Injectable } from '@nestjs/common';
import { RawIndicator } from '../connectors/feed-connector.interface';
import { IocType, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class StixNormalizerService {
  normalize(raw: RawIndicator, feedId: string): { iocData: Prisma.IocCreateInput; stixObject: Record<string, unknown> } {
    const typeMapping = this.mapType(raw.type);
    const iocType = typeMapping.iocType;
    const pattern = this.createPattern(typeMapping.stixType, raw.value);
    
    const now = new Date().toISOString();
    const stixObject = {
      type: 'indicator',
      spec_version: '2.1',
      id: `indicator--${randomUUID()}`,
      created: now,
      modified: now,
      indicator_types: ['malicious-activity'],
      pattern,
      pattern_type: 'stix',
      valid_from: now,
      labels: raw.tags || [],
    };

    const iocData: Prisma.IocCreateInput = {
      type: iocType,
      value: raw.value,
      stixData: stixObject,
      confidenceScore: raw.confidence || 50,
      tags: raw.tags || [],
      feed: { connect: { id: feedId } },
    };

    return { iocData, stixObject };
  }

  private mapType(rawType: string): { iocType: IocType; stixType: string } {
    const t = rawType.toLowerCase();
    if (t.includes('ipv4') || t === 'ip-src' || t === 'ip-dst' || t === 'ip') return { iocType: IocType.IP_ADDRESS, stixType: 'ipv4-addr:value' };
    if (t.includes('ipv6')) return { iocType: IocType.IP_ADDRESS, stixType: 'ipv6-addr:value' };
    if (t.includes('domain') || t === 'hostname') return { iocType: IocType.DOMAIN, stixType: 'domain-name:value' };
    if (t.includes('md5')) return { iocType: IocType.HASH_MD5, stixType: 'file:hashes.MD5' };
    if (t.includes('sha1')) return { iocType: IocType.HASH_SHA1, stixType: 'file:hashes.SHA-1' };
    if (t.includes('sha256')) return { iocType: IocType.HASH_SHA256, stixType: 'file:hashes.SHA-256' };
    if (t === 'url') return { iocType: IocType.URL, stixType: 'url:value' };
    if (t.includes('email')) return { iocType: IocType.EMAIL, stixType: 'email-addr:value' };
    if (t === 'filename') return { iocType: IocType.FILE_NAME, stixType: 'file:name' };
    
    return { iocType: IocType.DOMAIN, stixType: 'domain-name:value' }; // fallback
  }

  private createPattern(stixType: string, value: string): string {
    return `[${stixType} = '${value}']`;
  }
}
