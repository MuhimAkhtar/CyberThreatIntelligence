import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SiemService } from './siem.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateConnectorDto } from './dto/create-connector.dto';
import { UpdateConnectorDto } from './dto/update-connector.dto';
import { ConnectorQueryDto } from './dto/connector-query.dto';
import { ForwardAlertsDto } from './dto/forward-alerts.dto';

@Controller('siem')
export class SiemController {
  constructor(private readonly siemService: SiemService) {}

  @Post('connectors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createConnector(@Body() dto: CreateConnectorDto) {
    return this.siemService.createConnector(dto);
  }

  @Get('connectors')
  @UseGuards(JwtAuthGuard)
  listConnectors(@Query() query: ConnectorQueryDto) {
    return this.siemService.listConnectors(query);
  }

  @Get('connectors/:id')
  @UseGuards(JwtAuthGuard)
  getConnector(@Param('id') id: string) {
    return this.siemService.getConnector(id);
  }

  @Patch('connectors/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateConnector(@Param('id') id: string, @Body() dto: UpdateConnectorDto) {
    return this.siemService.updateConnector(id, dto);
  }

  @Delete('connectors/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteConnector(@Param('id') id: string) {
    return this.siemService.deleteConnector(id);
  }

  @Post('connectors/:id/test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  testConnection(@Param('id') id: string) {
    return this.siemService.testConnection(id);
  }

  @Post('connectors/:id/forward')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SOC_ANALYST', 'INVESTIGATOR', 'ADMIN')
  forwardAlerts(@Param('id') id: string, @Body() dto: ForwardAlertsDto) {
    return this.siemService.forwardAlerts(id, dto);
  }

  // Webhook ingest is unauthenticated for external SIEMs, protected by Rate Limiting (30 req/min)
  @Post('webhook/ingest')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  receiveWebhook(@Body() payload: any) {
    return this.siemService.receiveWebhook(payload);
  }

  @Get('connectors/:id/logs')
  @UseGuards(JwtAuthGuard)
  getSyncLogs(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.siemService.getSyncLogs(id, page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);
  }
}
