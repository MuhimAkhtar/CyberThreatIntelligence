import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MitreService } from './mitre.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TechniqueQueryDto } from './dto/technique-query.dto';
import { MapTechniqueDto } from './dto/map-technique.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class MitreController {
  constructor(private readonly mitreService: MitreService) {}

  @Get('mitre/techniques')
  searchTechniques(@Query() query: TechniqueQueryDto) {
    return this.mitreService.searchTechniques(query);
  }

  @Get('mitre/techniques/:id')
  getTechnique(@Param('id') id: string) {
    return this.mitreService.getTechnique(id);
  }

  @Get('mitre/coverage')
  getCoverageHeatmap() {
    return this.mitreService.getCoverageHeatmap();
  }

  @Roles('ADMIN')
  @Post('mitre/seed')
  seedTechniques() {
    return this.mitreService.seedTechniques();
  }

  @Get('alerts/:alertId/techniques')
  getAlertTechniques(@Param('alertId') alertId: string) {
    return this.mitreService.getAlertTechniques(alertId);
  }

  @Roles('SOC_ANALYST', 'INVESTIGATOR', 'ADMIN')
  @Post('alerts/:alertId/techniques')
  mapAlertToTechnique(
    @Param('alertId') alertId: string,
    @Body() dto: MapTechniqueDto,
  ) {
    return this.mitreService.mapAlertToTechnique(alertId, dto);
  }

  @Roles('SOC_ANALYST', 'INVESTIGATOR', 'ADMIN')
  @Delete('alerts/:alertId/techniques/:techniqueId')
  unmapAlertTechnique(
    @Param('alertId') alertId: string,
    @Param('techniqueId') techniqueId: string,
  ) {
    return this.mitreService.unmapAlertTechnique(alertId, techniqueId);
  }
}
