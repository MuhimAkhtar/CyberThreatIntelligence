import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiService } from './gemini.service';
import { ReportFormat } from '@prisma/client';
import { ReportQueryDto } from './dto/report-query.dto';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
  ) {}

  async aggregateCaseContext(caseId: string) {
    const caseData = await this.prisma.investigationCase.findUnique({
      where: { id: caseId },
      include: {
        notes: true,
        caseAlerts: {
          include: {
            alert: true,
          },
        },
        caseIocs: {
          include: {
            ioc: true,
          },
        },
        forensicArtifacts: true,
      },
    });

    if (!caseData) {
      throw new NotFoundException(`Case with ID ${caseId} not found`);
    }

    const alerts = caseData.caseAlerts.map(ca => ca.alert);
    const iocs = caseData.caseIocs.map(ci => ci.ioc);

    return {
      case: caseData,
      alerts,
      iocs,
      notes: caseData.notes,
      artifacts: caseData.forensicArtifacts,
      timeline: 'Timeline aggregation placeholder',
    };
  }

  private async generateWithKimiModal(context: any, format: string): Promise<{ content: string; model: string; attackTechniques: any; riskScore: number } | null> {
    try {
      this.logger.log(`Calling Kimi 3 on Modal Cloud for format: ${format}`);
      const tempPath = path.join(process.cwd(), 'scratch_modal_input.json');
      const inputPayload = {
        case: context.case,
        alerts: context.alerts,
        iocs: context.iocs,
        artifacts: context.artifacts,
        format,
      };
      fs.writeFileSync(tempPath, JSON.stringify(inputPayload, null, 2));

      const modalScript = path.join(process.cwd(), '..', 'modal_app', 'run_kimi.py');
      const output = execSync(`python "${modalScript}" "${tempPath}"`, { timeout: 45000 }).toString();

      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

      const jsonStart = output.indexOf('{');
      if (jsonStart !== -1) {
        const parsed = JSON.parse(output.substring(jsonStart));
        return {
          content: parsed.content,
          model: parsed.model || 'Kimi-3-Modal-Cloud',
          attackTechniques: parsed.attackTechniques,
          riskScore: parsed.riskScore,
        };
      }
    } catch (err: any) {
      this.logger.warn(`Modal Kimi 3 execution warning: ${err.message}`);
    }
    return null;
  }

  async generateSummary(caseId: string, userId: string) {
    this.logger.log(`Generating summary for case ${caseId}`);
    const context = await this.aggregateCaseContext(caseId);

    let content = '';
    let aiModelUsed = 'Kimi-3-Modal-Cloud (muhimakhtar4)';
    let attackTechniques = null;
    let riskScore = 88;

    const modalResult = await this.generateWithKimiModal(context, 'EXECUTIVE');
    if (modalResult) {
      content = modalResult.content;
      aiModelUsed = modalResult.model;
      attackTechniques = modalResult.attackTechniques;
      riskScore = modalResult.riskScore;
    } else if (this.geminiService.isAvailable()) {
      const systemPrompt = 'You are a cybersecurity expert. Produce a concise 2-3 paragraph incident summary based on the provided data.';
      const userPrompt = `Case Data: ${JSON.stringify(context, null, 2)}`;
      content = await this.geminiService.generateContent(systemPrompt, userPrompt);
      aiModelUsed = 'Gemini-2.0-Flash';
    } else {
      const alertSeverities = context.alerts.map(a => a.severity).join(', ') || 'None';
      const iocTypes = context.iocs.map(i => i.type).join(', ') || 'None';
      content = this.generateFallbackSummary(context.case.title, context.alerts.length, alertSeverities, context.iocs.length, iocTypes, context.artifacts.length, context.case.description);
      aiModelUsed = 'Fallback-Template';
    }

    return this.prisma.incidentReport.create({
      data: {
        caseId,
        generatedByUserId: userId,
        format: ReportFormat.EXECUTIVE,
        title: `Executive Summary - ${context.case.title}`,
        content,
        aiModelUsed,
        attackTechniques,
        riskScore,
      },
    });
  }

  private generateFallbackSummary(title: string, alertCount: number, severities: string, iocCount: number, types: string, artifactCount: number, description: string): string {
    return `Incident Summary for Case: ${title}\n\nAlerts: ${alertCount} (${severities})\nIOCs: ${iocCount} (${types})\nForensic Artifacts: ${artifactCount}\n\nDescription: ${description}`;
  }

  async generateReport(caseId: string, userId: string, format: ReportFormat) {
    this.logger.log(`Generating report (${format}) for case ${caseId}`);
    const context = await this.aggregateCaseContext(caseId);

    let content = '';
    let aiModelUsed = 'Kimi-3-Modal-Cloud (muhimakhtar4)';
    let attackTechniques = null;
    let riskScore = 92;

    const modalResult = await this.generateWithKimiModal(context, format);
    if (modalResult) {
      content = modalResult.content;
      aiModelUsed = modalResult.model;
      attackTechniques = modalResult.attackTechniques;
      riskScore = modalResult.riskScore;
    } else if (this.geminiService.isAvailable()) {
      let systemPrompt = `Generate a ${format} cybersecurity incident report.`;
      const userPrompt = `Case Data:\n${JSON.stringify(context, null, 2)}`;
      content = await this.geminiService.generateContent(systemPrompt, userPrompt);
      aiModelUsed = 'Gemini-2.0-Flash';
    } else {
      content = this.generateFallbackReport(format, context);
      aiModelUsed = 'Fallback-Template';
    }

    return this.prisma.incidentReport.create({
      data: {
        caseId,
        generatedByUserId: userId,
        format,
        title: `${format} Report - ${context.case.title}`,
        content,
        aiModelUsed,
        attackTechniques,
        riskScore,
      },
    });
  }

  private generateFallbackReport(format: ReportFormat, context: any): string {
    return `# ${format} Report\n\nGenerated without AI due to unavailability.\n\n## Case Title\n${context.case.title}\n\n## Data Summary\n- Alerts: ${context.alerts.length}\n- IOCs: ${context.iocs.length}\n- Artifacts: ${context.artifacts.length}\n`;
  }

  async listReports(caseId: string, query: ReportQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = { caseId };
    if (query.format) {
      whereClause.format = query.format;
    }

    const [data, total] = await Promise.all([
      this.prisma.incidentReport.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { generatedAt: 'desc' },
      }),
      this.prisma.incidentReport.count({ where: whereClause }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getReport(reportId: string) {
    const report = await this.prisma.incidentReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    return report;
  }
}
