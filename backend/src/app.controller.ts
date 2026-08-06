import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'cyber-threat-platform-api',
      version: '0.1.0',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/stats')
  async getDashboardStats() {
    const [activeAlerts, openCases, totalIocs, totalCves, criticalCves] = await Promise.all([
      this.prisma.alert.count({
        where: { status: { notIn: ['RESOLVED', 'FALSE_POSITIVE'] } },
      }),
      this.prisma.investigationCase.count({
        where: { status: { notIn: ['CLOSED'] } },
      }),
      this.prisma.ioc.count(),
      this.prisma.cve.count(),
      this.prisma.cve.count({
        where: { severity: 'CRITICAL' },
      }),
    ]);

    // Live reachability health check
    let isDbHealthy = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      isDbHealthy = true;
    } catch {
      isDbHealthy = false;
    }

    const systemHealth = isDbHealthy ? 'HEALTHY' : 'DEGRADED';

    return {
      activeAlerts,
      openCases,
      totalIocs,
      totalCves,
      criticalCves,
      systemHealth,
      // Backwards compatibility keys
      activeThreats: activeAlerts + totalIocs,
      openAlerts: activeAlerts,
      activeInvestigations: openCases,
      timestamp: new Date().toISOString(),
    };
  }
}
