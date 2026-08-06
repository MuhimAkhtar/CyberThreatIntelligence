import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface GeoIpResult {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lon: number;
  cached: boolean;
}

@Injectable()
export class GeoIpService {
  private readonly logger = new Logger(GeoIpService.name);
  private cache = new Map<string, GeoIpResult>();

  constructor(private readonly prisma: PrismaService) {}

  lookupIp(ip: string): GeoIpResult {
    const cleanIp = ip.trim();

    // Check in-memory cache
    if (this.cache.has(cleanIp)) {
      this.logger.log(`GeoIP Cache Hit for IP: ${cleanIp}`);
      const cachedResult = this.cache.get(cleanIp)!;
      return { ...cachedResult, cached: true };
    }

    // Deterministic geo-location mock based on IP hash for offline/local stability
    const mockGeo = this.generateDeterministicGeo(cleanIp);
    const result: GeoIpResult = { ...mockGeo, cached: false };

    // Store in cache
    this.cache.set(cleanIp, result);
    this.logger.log(`GeoIP Cache Miss for IP: ${cleanIp} (Resolved & Cached)`);

    return result;
  }

  async getAttackMapData() {
    // Fetch active IP_ADDRESS IOCs from PostgreSQL
    const ipIocs = await this.prisma.ioc.findMany({
      where: { type: 'IP_ADDRESS' },
      take: 100,
      orderBy: { lastSeenAt: 'desc' },
      select: { id: true, value: true, confidenceScore: true, tags: true, firstSeenAt: true },
    });

    const mapPoints = ipIocs.map((ioc) => {
      const geo = this.lookupIp(ioc.value);
      return {
        iocId: ioc.id,
        ip: ioc.value,
        confidence: ioc.confidenceScore,
        tags: ioc.tags,
        country: geo.country,
        countryCode: geo.countryCode,
        city: geo.city,
        lat: geo.lat,
        lon: geo.lon,
        timestamp: ioc.firstSeenAt,
      };
    });

    return {
      totalPoints: mapPoints.length,
      attackPoints: mapPoints,
    };
  }

  private generateDeterministicGeo(ip: string): Omit<GeoIpResult, 'cached'> {
    const hash = ip.split('.').reduce((acc, octet) => acc + parseInt(octet || '0', 10), 0);

    const locations = [
      { country: 'United States', countryCode: 'US', city: 'Ashburn', lat: 39.0438, lon: -77.4874 },
      { country: 'Germany', countryCode: 'DE', city: 'Frankfurt', lat: 50.1109, lon: 8.6821 },
      { country: 'China', countryCode: 'CN', city: 'Beijing', lat: 39.9042, lon: 116.4074 },
      { country: 'Russia', countryCode: 'RU', city: 'Moscow', lat: 55.7558, lon: 37.6173 },
      { country: 'Netherlands', countryCode: 'NL', city: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
      { country: 'Japan', countryCode: 'JP', city: 'Tokyo', lat: 35.6762, lon: 139.6503 },
      { country: 'Brazil', countryCode: 'BR', city: 'São Paulo', lat: -23.5505, lon: -46.6333 },
      { country: 'United Kingdom', countryCode: 'GB', city: 'London', lat: 51.5074, lon: -0.1278 },
    ];

    const loc = locations[hash % locations.length];
    return {
      ip,
      ...loc,
    };
  }
}
