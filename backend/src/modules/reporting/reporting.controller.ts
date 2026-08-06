import { Controller, Post, Get, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Roles('SOC_ANALYST', 'INVESTIGATOR', 'ADMIN')
  @Post('cases/:id/summarize')
  async generateSummary(@Param('id') caseId: string, @Request() req: any) {
    return this.reportingService.generateSummary(caseId, req.user.id);
  }

  @Roles('SOC_ANALYST', 'INVESTIGATOR', 'ADMIN')
  @Post('cases/:id/reports')
  async generateReport(
    @Param('id') caseId: string,
    @Body() dto: GenerateReportDto,
    @Request() req: any,
  ) {
    return this.reportingService.generateReport(caseId, req.user.id, dto.format);
  }

  @Roles('SOC_ANALYST', 'INVESTIGATOR', 'ADMIN')
  @Get('cases/:id/reports')
  async listReports(
    @Param('id') caseId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportingService.listReports(caseId, query);
  }

  @Roles('SOC_ANALYST', 'INVESTIGATOR', 'ADMIN')
  @Get('reports/:id')
  async getReport(@Param('id') reportId: string) {
    return this.reportingService.getReport(reportId);
  }
}
