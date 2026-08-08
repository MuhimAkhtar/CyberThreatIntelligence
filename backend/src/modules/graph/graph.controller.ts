import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GraphThreatService } from './graph-threat.service';

@ApiTags('Threat Graph Knowledge Engine')
@Controller('graph')
@UseGuards(JwtAuthGuard)
export class GraphController {
  constructor(private readonly graphService: GraphThreatService) {}

  @Get('threat-network')
  @ApiOperation({ summary: 'Fetch Threat Actor Knowledge Relationship Graph' })
  @ApiResponse({ status: 200, description: 'Interactive Graph Nodes and Edges' })
  getThreatNetwork() {
    return this.graphService.getThreatNetwork();
  }
}
