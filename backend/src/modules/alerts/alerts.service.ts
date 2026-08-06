import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertStatus, AlertSeverity, Alert } from '@prisma/client';
import { AlertQueryDto } from './dto/alert-query.dto';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';

const VALID_TRANSITIONS: Record<AlertStatus, AlertStatus[]> = {
  [AlertStatus.NEW]: [AlertStatus.TRIAGED, AlertStatus.FALSE_POSITIVE],
  [AlertStatus.TRIAGED]: [AlertStatus.IN_PROGRESS, AlertStatus.FALSE_POSITIVE],
  [AlertStatus.IN_PROGRESS]: [AlertStatus.RESOLVED, AlertStatus.FALSE_POSITIVE],
  [AlertStatus.RESOLVED]: [],
  [AlertStatus.FALSE_POSITIVE]: [],
};

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AlertQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    if (query.assigneeId) where.assignedToUserId = query.assigneeId;

    const [data, total] = await Promise.all([
      this.prisma.alert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedToUser: {
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
          },
          rule: true,
        },
      }),
      this.prisma.alert.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Alert> {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: {
        assignedToUser: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
        rule: true,
      },
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    return alert;
  }

  async updateStatus(id: string, newStatus: AlertStatus): Promise<Alert> {
    const alert = await this.findOne(id);

    const allowed = VALID_TRANSITIONS[alert.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new ConflictException(
        `Invalid status transition from ${alert.status} to ${newStatus}. Allowed transitions: [${allowed.join(', ')}]`,
      );
    }

    const isResolved = newStatus === AlertStatus.RESOLVED || newStatus === AlertStatus.FALSE_POSITIVE;

    return this.prisma.alert.update({
      where: { id },
      data: {
        status: newStatus,
        resolvedAt: isResolved ? new Date() : null,
      },
    });
  }

  async assignAlert(id: string, assignedToUserId?: string | null): Promise<Alert> {
    await this.findOne(id); // throws NotFoundException if missing

    if (assignedToUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: assignedToUserId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${assignedToUserId} not found`);
      }
    }

    return this.prisma.alert.update({
      where: { id },
      data: { assignedToUserId: assignedToUserId || null },
      include: {
        assignedToUser: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  async getStats() {
    const [byStatus, bySeverity] = await Promise.all([
      this.prisma.alert.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.alert.groupBy({
        by: ['severity'],
        _count: { id: true },
      }),
    ]);

    const statusCounts = byStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    const severityCounts = bySeverity.reduce((acc, curr) => {
      acc[curr.severity] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    const total = await this.prisma.alert.count();

    return {
      total,
      byStatus: statusCounts,
      bySeverity: severityCounts,
    };
  }

  // --- Alert Rules ---

  async findAllRules() {
    return this.prisma.alertRule.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { alerts: true } } },
    });
  }

  async createRule(dto: CreateAlertRuleDto) {
    return this.prisma.alertRule.create({
      data: {
        name: dto.name,
        description: dto.description,
        ruleType: dto.ruleType,
        config: dto.config,
        enabled: dto.enabled !== undefined ? dto.enabled : true,
      },
    });
  }

  async updateRule(id: string, updateData: { enabled?: boolean; config?: any; name?: string; description?: string }) {
    const rule = await this.prisma.alertRule.findUnique({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`AlertRule with ID ${id} not found`);
    }

    return this.prisma.alertRule.update({
      where: { id },
      data: updateData,
    });
  }
}
