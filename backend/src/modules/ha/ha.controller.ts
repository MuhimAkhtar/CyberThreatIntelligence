import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HaHealthMonitorService } from './ha-health-monitor.service';

@ApiTags('Multi-Region HA Cluster Health Engine')
@Controller('ha')
@UseGuards(JwtAuthGuard)
export class HaController {
  constructor(private readonly haService: HaHealthMonitorService) {}

  @Get('cluster-status')
  @ApiOperation({ summary: 'Get Multi-Region Active-Active Cluster Replication Health' })
  @ApiResponse({ status: 200, description: 'Cluster Nodes Health and Replication Metrics' })
  getClusterStatus() {
    return this.haService.getClusterStatus();
  }
}
