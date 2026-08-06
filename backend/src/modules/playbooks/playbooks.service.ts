import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlaybookDto } from './dto/create-playbook.dto';
import { UpdatePlaybookDto } from './dto/update-playbook.dto';
import { PlaybookQueryDto } from './dto/playbook-query.dto';
import { PlaybookEngine } from './playbook-engine';
import { PlaybookTrigger, PlaybookStatus } from '@prisma/client';

@Injectable()
export class PlaybooksService {
  private readonly logger = new Logger(PlaybooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly playbookEngine: PlaybookEngine
  ) {}

  async createPlaybook(userId: string, dto: CreatePlaybookDto) {
    return this.prisma.playbook.create({
      data: {
        name: dto.name,
        description: dto.description,
        trigger: dto.trigger,
        conditions: dto.conditions as any,
        actions: dto.actions as any,
        status: 'DRAFT',
        createdById: userId,
      }
    });
  }

  async listPlaybooks(query: PlaybookQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.trigger) {
      where.trigger = query.trigger;
    }

    const [data, total] = await Promise.all([
      this.prisma.playbook.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { executions: true }
          }
        }
      }),
      this.prisma.playbook.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getPlaybook(id: string) {
    const playbook = await this.prisma.playbook.findUnique({
      where: { id },
      include: {
        executions: {
          take: 10,
          orderBy: { executedAt: 'desc' }
        }
      }
    });

    if (!playbook) {
      throw new NotFoundException(`Playbook with id ${id} not found`);
    }

    return playbook;
  }

  async updatePlaybook(id: string, dto: UpdatePlaybookDto) {
    const playbook = await this.prisma.playbook.findUnique({ where: { id } });
    if (!playbook) {
      throw new NotFoundException(`Playbook with id ${id} not found`);
    }

    return this.prisma.playbook.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description && { description: dto.description }),
        ...(dto.trigger && { trigger: dto.trigger }),
        ...(dto.conditions && { conditions: dto.conditions as any }),
        ...(dto.actions && { actions: dto.actions as any }),
        ...(dto.status && { status: dto.status })
      }
    });
  }

  async deletePlaybook(id: string) {
    const playbook = await this.prisma.playbook.findUnique({ where: { id } });
    if (!playbook) {
      throw new NotFoundException(`Playbook with id ${id} not found`);
    }

    return this.prisma.playbook.delete({
      where: { id }
    });
  }

  async activatePlaybook(id: string) {
    const playbook = await this.prisma.playbook.findUnique({ where: { id } });
    if (!playbook) {
      throw new NotFoundException(`Playbook with id ${id} not found`);
    }

    return this.prisma.playbook.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });
  }

  async deactivatePlaybook(id: string) {
    const playbook = await this.prisma.playbook.findUnique({ where: { id } });
    if (!playbook) {
      throw new NotFoundException(`Playbook with id ${id} not found`);
    }

    return this.prisma.playbook.update({
      where: { id },
      data: { status: 'DISABLED' }
    });
  }

  async executePlaybook(id: string, triggeredBy: string, context?: any) {
    const playbook = await this.getPlaybook(id);

    if (playbook.status !== 'ACTIVE' && triggeredBy !== 'MANUAL') {
      this.logger.warn(`Attempted to execute non-active playbook ${id}`);
      throw new Error('Playbook is not active');
    }

    const { results, success, durationMs } = await this.playbookEngine.executeActions(
      playbook.actions as any[],
      context || {}
    );

    const execution = await this.prisma.playbookExecution.create({
      data: {
        playbookId: id,
        triggeredBy,
        actionsRun: results as any,
        success,
        durationMs,
      },
    });

    return execution;
  }

  async evaluateTrigger(trigger: PlaybookTrigger, eventData: any) {
    const activePlaybooks = await this.prisma.playbook.findMany({
      where: {
        trigger,
        status: 'ACTIVE'
      }
    });

    let evaluated = activePlaybooks.length;
    let executed = 0;

    for (const playbook of activePlaybooks) {
      const conditions = playbook.conditions as Record<string, any>;
      let matches = true;

      if (conditions && typeof conditions === 'object') {
        for (const [key, value] of Object.entries(conditions)) {
          if (eventData[key] !== value) {
            matches = false;
            break;
          }
        }
      }

      if (matches) {
        try {
          await this.executePlaybook(playbook.id, trigger, eventData);
          executed++;
        } catch (error: any) {
          this.logger.error(`Error executing playbook ${playbook.id} automatically: ${error.message}`, error.stack);
        }
      }
    }

    return { evaluated, executed };
  }

  async getExecutionHistory(playbookId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.playbookExecution.findMany({
        where: { playbookId },
        skip,
        take: limit,
        orderBy: { executedAt: 'desc' }
      }),
      this.prisma.playbookExecution.count({ where: { playbookId } })
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}
