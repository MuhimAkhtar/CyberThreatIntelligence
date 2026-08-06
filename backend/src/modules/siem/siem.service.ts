import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConnectorDto } from './dto/create-connector.dto';
import { UpdateConnectorDto } from './dto/update-connector.dto';
import { ConnectorQueryDto } from './dto/connector-query.dto';
import { ForwardAlertsDto } from './dto/forward-alerts.dto';
import { CefFormatter } from './formatters/cef.formatter';
import { SplunkHecConnector } from './connectors/splunk-hec.connector';
import { WazuhConnector } from './connectors/wazuh.connector';
import { WebhookConnector } from './connectors/webhook.connector';
import { SiemType, AlertSeverity } from '@prisma/client';

@Injectable()
export class SiemService {
  private readonly logger = new Logger(SiemService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cefFormatter: CefFormatter,
    private readonly splunkConnector: SplunkHecConnector,
    private readonly wazuhConnector: WazuhConnector,
    private readonly webhookConnector: WebhookConnector,
  ) {}

  async createConnector(dto: CreateConnectorDto) {
    this.logger.log(`Creating SIEM connector: ${dto.name}`);
    return this.prisma.siemConnector.create({
      data: {
        name: dto.name,
        type: dto.type,
        config: dto.config,
        enabled: dto.enabled ?? true,
      },
    });
  }

  async listConnectors(query: ConnectorQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where = query.type ? { type: query.type } : {};

    const [data, total] = await Promise.all([
      this.prisma.siemConnector.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.siemConnector.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getConnector(id: string) {
    const connector = await this.prisma.siemConnector.findUnique({ where: { id } });
    if (!connector) {
      throw new NotFoundException(`Connector with ID ${id} not found`);
    }
    return connector;
  }

  async updateConnector(id: string, dto: UpdateConnectorDto) {
    await this.getConnector(id);
    return this.prisma.siemConnector.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.type && { type: dto.type }),
        ...(dto.config && { config: dto.config }),
        ...(dto.enabled !== undefined && { enabled: dto.enabled }),
      },
    });
  }

  async deleteConnector(id: string) {
    await this.getConnector(id);
    return this.prisma.siemConnector.delete({ where: { id } });
  }

  async testConnection(id: string) {
    const connector = await this.getConnector(id);

    switch (connector.type) {
      case SiemType.SPLUNK_HEC:
        return this.splunkConnector.testConnection(connector.config);
      case SiemType.WAZUH:
        return this.wazuhConnector.testConnection(connector.config);
      case SiemType.WEBHOOK:
        return this.webhookConnector.testConnection(connector.config);
      default:
        return { success: true, message: `Generic connector ${connector.name} configured.` };
    }
  }

  async forwardAlerts(id: string, dto: ForwardAlertsDto) {
    const connector = await this.getConnector(id);
    if (!connector.enabled) {
      throw new Error('Connector is disabled');
    }

    let alerts: any[] = [];
    if (dto.alertIds && dto.alertIds.length > 0) {
      alerts = await this.prisma.alert.findMany({
        where: { id: { in: dto.alertIds } },
      });
    } else {
      alerts = await this.prisma.alert.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }

    if (alerts.length === 0) {
      return { eventsForwarded: 0, errors: [] };
    }

    let events: any[] = alerts;
    if (connector.type === SiemType.SYSLOG_CEF) {
      events = this.cefFormatter.formatBatch(alerts) as any;
    }

    let result = { forwarded: 0, errors: [] as string[] };
    switch (connector.type) {
      case SiemType.SPLUNK_HEC:
        result = await this.splunkConnector.forwardEvents(connector.config, events);
        break;
      case SiemType.WAZUH:
        result = await this.wazuhConnector.forwardEvents(connector.config, events);
        break;
      case SiemType.WEBHOOK:
        result = await this.webhookConnector.forwardEvents(connector.config, events);
        break;
      default:
        result = { forwarded: events.length, errors: [] };
    }

    await this.prisma.siemSyncLog.create({
      data: {
        connectorId: connector.id,
        eventsForwarded: result.forwarded,
        errorMessage: result.errors.length > 0 ? result.errors.join('; ') : null,
      },
    });

    await this.prisma.siemConnector.update({
      where: { id: connector.id },
      data: { lastSyncAt: new Date() },
    });

    return { eventsForwarded: result.forwarded, errors: result.errors };
  }

  async receiveWebhook(payload: any) {
    this.logger.log('Receiving incoming SIEM webhook');
    const title = payload.title || 'Webhook Alert';
    const description = payload.description || JSON.stringify(payload);

    let severity: AlertSeverity = AlertSeverity.LOW;
    if (payload.severity) {
      const s = String(payload.severity).toUpperCase();
      if (s === 'CRITICAL') severity = AlertSeverity.CRITICAL;
      else if (s === 'HIGH') severity = AlertSeverity.HIGH;
      else if (s === 'MEDIUM') severity = AlertSeverity.MEDIUM;
    }

    const alert = await this.prisma.alert.create({
      data: {
        title,
        description,
        severity,
        sourceType: 'SIEM_WEBHOOK',
        sourceId: payload.id || 'webhook-' + Date.now(),
      },
    });

    return alert;
  }

  async getSyncLogs(connectorId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.siemSyncLog.findMany({
        where: { connectorId },
        skip,
        take: limit,
        orderBy: { executedAt: 'desc' },
      }),
      this.prisma.siemSyncLog.count({ where: { connectorId } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
