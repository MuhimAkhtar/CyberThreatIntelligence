import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CasePriority, CaseStatus, AlertSeverity, UserRole } from '@prisma/client';

@Injectable()
export class PlaybookEngine {
  private readonly logger = new Logger(PlaybookEngine.name);

  constructor(private readonly prisma: PrismaService) {}

  async executeActions(actions: any[], context: any): Promise<{ results: any[]; success: boolean; durationMs: number }> {
    const startTime = Date.now();
    const results = [];
    let success = true;

    for (const action of actions) {
      try {
        const result = await this.executeSingleAction(action, context);
        results.push({ type: action.type, success: true, result, error: null });
      } catch (error: any) {
        this.logger.error(`Failed to execute action ${action.type}: ${error.message}`, error.stack);
        results.push({ type: action.type, success: false, result: null, error: error.message });
        success = false;
      }
    }

    const durationMs = Date.now() - startTime;
    return { results, success, durationMs };
  }

  private async executeSingleAction(action: any, context: any): Promise<any> {
    const { type, params } = action;

    switch (type) {
      case 'CREATE_CASE':
        return await this.prisma.investigationCase.create({
          data: {
            title: params?.title || 'Auto-Case',
            description: params?.description || 'Automatically created by playbook',
            priority: (params?.priority as CasePriority) || CasePriority.HIGH,
            createdById: context?.userId,
            status: CaseStatus.OPEN,
          },
        });

      case 'ESCALATE_SEVERITY':
        if (!context?.alertId) {
          throw new Error('Missing alertId in context for ESCALATE_SEVERITY');
        }
        return await this.prisma.alert.update({
          where: { id: context.alertId },
          data: { severity: (params?.newSeverity as AlertSeverity) || AlertSeverity.CRITICAL },
        });

      case 'ASSIGN_ANALYST': {
        if (!context?.alertId) {
          throw new Error('Missing alertId in context for ASSIGN_ANALYST');
        }
        const user = await this.prisma.user.findFirst({
          where: {
            role: { in: [UserRole.SOC_ANALYST, UserRole.INVESTIGATOR] },
          },
        });
        if (!user) {
          throw new Error('No eligible user found to assign');
        }
        return await this.prisma.alert.update({
          where: { id: context.alertId },
          data: { assignedToUserId: user.id },
        });
      }

      case 'ADD_CASE_NOTE':
        if (!context?.caseId) {
          throw new Error('Missing caseId in context for ADD_CASE_NOTE');
        }
        return await this.prisma.caseNote.create({
          data: {
            caseId: context.caseId,
            content: params?.content || 'Automated playbook note added.',
            authorUserId: context?.userId,
          },
        });

      case 'SEND_NOTIFICATION': {
        const targetUserId = params?.userId || context?.userId;
        if (!targetUserId) {
          throw new Error('Missing target userId for SEND_NOTIFICATION');
        }
        return await this.prisma.notification.create({
          data: {
            userId: targetUserId,
            channel: 'IN_APP',
            subject: params?.subject || 'Playbook Notification',
            body: params?.body || 'A playbook has triggered an automated notification.',
          },
        });
      }

      case 'ENRICH_IOC':
        this.logger.log(`Enriching IOC ID ${context?.iocId} with type ${params?.enrichmentType}`);
        return {
          action: 'ENRICH_IOC',
          iocId: context?.iocId,
          enrichmentType: params?.enrichmentType,
          status: 'Enrichment requested',
        };

      case 'FORWARD_TO_SIEM':
        this.logger.log(`Forwarding Alert IDs ${context?.alertIds} to connector ${params?.connectorId}`);
        return {
          action: 'FORWARD_TO_SIEM',
          alertIds: context?.alertIds,
          connectorId: params?.connectorId,
          status: 'Forwarding requested',
        };

      case 'MAP_MITRE_TECHNIQUE':
        if (!context?.alertId || !params?.techniqueId) {
          throw new Error('Missing alertId or techniqueId for MAP_MITRE_TECHNIQUE');
        }
        return await this.prisma.alertTechnique.create({
          data: {
            alertId: context.alertId,
            techniqueId: params.techniqueId,
          },
        });

      default:
        throw new Error(`Unsupported action type: ${type}`);
    }
  }
}
