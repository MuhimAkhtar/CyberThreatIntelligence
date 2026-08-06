import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CaseStatus, CasePriority, InvestigationCase } from '@prisma/client';
import { CreateInvestigationDto } from './dto/create-investigation.dto';
import { InvestigationQueryDto } from './dto/investigation-query.dto';

const VALID_CASE_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  [CaseStatus.OPEN]: [CaseStatus.IN_PROGRESS, CaseStatus.CLOSED],
  [CaseStatus.IN_PROGRESS]: [CaseStatus.PENDING_REVIEW, CaseStatus.CLOSED],
  [CaseStatus.PENDING_REVIEW]: [CaseStatus.IN_PROGRESS, CaseStatus.CLOSED],
  [CaseStatus.CLOSED]: [],
};

@Injectable()
export class InvestigationsService {
  private readonly logger = new Logger(InvestigationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createCase(createdById: string, dto: CreateInvestigationDto): Promise<InvestigationCase> {
    const description = dto.description?.trim() || dto.title;

    // Build initial list of alert IDs (from alertIds array + sourceAlertId if provided)
    const initialAlertIds = new Set<string>(dto.alertIds || []);
    if (dto.sourceAlertId) {
      initialAlertIds.add(dto.sourceAlertId);
    }

    const createdCase = await this.prisma.investigationCase.create({
      data: {
        title: dto.title,
        description,
        priority: dto.priority || CasePriority.MEDIUM,
        status: CaseStatus.OPEN,
        createdById,
        assignedToUserId: dto.assignedToUserId || null,
        caseAlerts: initialAlertIds.size > 0 ? {
          create: Array.from(initialAlertIds).map((alertId) => ({ alertId })),
        } : undefined,
        caseIocs: dto.iocIds && dto.iocIds.length > 0 ? {
          create: dto.iocIds.map((iocId) => ({ iocId })),
        } : undefined,
      },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        assignedToUser: { select: { id: true, email: true, firstName: true, lastName: true } },
        caseAlerts: { include: { alert: true } },
        caseIocs: { include: { ioc: true } },
        notes: { include: { authorUser: { select: { id: true, email: true, firstName: true, lastName: true } } } },
      },
    });

    this.logger.log(`Created InvestigationCase ${createdCase.id} by user ${createdById}`);
    return createdCase;
  }

  async findAll(query: InvestigationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assignedToUserId) where.assignedToUserId = query.assignedToUserId;

    // Sorting by priority / createdAt
    let orderBy: any = { createdAt: 'desc' };
    if (query.sortBy === 'priority') {
      orderBy = { priority: query.sortOrder || 'desc' };
    } else if (query.sortBy === 'updatedAt') {
      orderBy = { updatedAt: query.sortOrder || 'desc' };
    }

    const [data, total] = await Promise.all([
      this.prisma.investigationCase.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          assignedToUser: { select: { id: true, email: true, firstName: true, lastName: true } },
          caseAlerts: { include: { alert: true } },
          caseIocs: { include: { ioc: true } },
          notes: {
            orderBy: { createdAt: 'asc' },
            include: { authorUser: { select: { id: true, email: true, firstName: true, lastName: true } } },
          },
        },
      }),
      this.prisma.investigationCase.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const caseRecord = await this.prisma.investigationCase.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        assignedToUser: { select: { id: true, email: true, firstName: true, lastName: true } },
        caseAlerts: { include: { alert: true } },
        caseIocs: { include: { ioc: true } },
        notes: {
          orderBy: { createdAt: 'asc' },
          include: { authorUser: { select: { id: true, email: true, firstName: true, lastName: true } } },
        },
      },
    });

    if (!caseRecord) {
      throw new NotFoundException(`Investigation case ${id} not found`);
    }

    return caseRecord;
  }

  async updateStatus(id: string, newStatus: CaseStatus) {
    const caseRecord = await this.findOne(id);

    const allowed = VALID_CASE_TRANSITIONS[caseRecord.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new ConflictException(
        `Invalid status transition from ${caseRecord.status} to ${newStatus}. Allowed transitions: [${allowed.join(', ')}]`,
      );
    }

    return this.prisma.investigationCase.update({
      where: { id },
      data: {
        status: newStatus,
        closedAt: newStatus === CaseStatus.CLOSED ? new Date() : null,
      },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        assignedToUser: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async addNote(caseId: string, authorUserId: string, content: string) {
    await this.findOne(caseId); // verifies existence

    const note = await this.prisma.caseNote.create({
      data: {
        caseId,
        authorUserId,
        content: content.trim(),
      },
      include: {
        authorUser: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    this.logger.log(`Added note ${note.id} to case ${caseId} by user ${authorUserId}`);
    return note;
  }

  async linkAlertToCase(caseId: string, alertId: string) {
    await this.findOne(caseId); // verifies existence

    const alertRecord = await this.prisma.alert.findUnique({ where: { id: alertId } });
    if (!alertRecord) {
      throw new NotFoundException(`Alert ${alertId} not found`);
    }

    const link = await this.prisma.caseAlert.upsert({
      where: { caseId_alertId: { caseId, alertId } },
      create: { caseId, alertId },
      update: {},
      include: { alert: true },
    });

    this.logger.log(`Linked Alert ${alertId} to Case ${caseId}`);
    return link;
  }

  async getCaseTimeline(caseId: string) {
    const caseRecord = await this.findOne(caseId);

    const timelineEvents: Array<{
      id: string;
      eventType: string;
      timestamp: Date;
      title: string;
      details: any;
    }> = [];

    // 1. Case Creation event
    timelineEvents.push({
      id: `case-created-${caseRecord.id}`,
      eventType: 'CASE_CREATED',
      timestamp: caseRecord.createdAt,
      title: `Case Created: ${caseRecord.title}`,
      details: { priority: caseRecord.priority, status: caseRecord.status, createdBy: caseRecord.createdBy },
    });

    // 2. Case Notes events
    caseRecord.notes.forEach((note) => {
      timelineEvents.push({
        id: `case-note-${note.id}`,
        eventType: 'CASE_NOTE_ADDED',
        timestamp: note.createdAt,
        title: `Note Added by ${note.authorUser ? note.authorUser.firstName : 'Analyst'}`,
        details: { content: note.content, author: note.authorUser },
      });
    });

    // 3. Linked Alerts events
    caseRecord.caseAlerts.forEach((ca) => {
      timelineEvents.push({
        id: `case-alert-${ca.id}`,
        eventType: 'ALERT_LINKED',
        timestamp: ca.createdAt,
        title: `Alert Linked: ${ca.alert.title}`,
        details: { alertId: ca.alert.id, severity: ca.alert.severity, sourceType: ca.alert.sourceType },
      });
    });

    // 4. Closed event if closed
    if (caseRecord.closedAt) {
      timelineEvents.push({
        id: `case-closed-${caseRecord.id}`,
        eventType: 'CASE_CLOSED',
        timestamp: caseRecord.closedAt,
        title: `Case Closed: ${caseRecord.title}`,
        details: { status: 'CLOSED' },
      });
    }

    // Sort chronologically ascending
    timelineEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      caseId,
      totalEvents: timelineEvents.length,
      events: timelineEvents,
    };
  }
}
