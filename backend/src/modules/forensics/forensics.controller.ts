import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ForensicsService } from './forensics.service';
import { CreateArtifactDto } from './dto/create-artifact.dto';
import { ArtifactQueryDto } from './dto/artifact-query.dto';
import { CustodyEventDto } from './dto/custody-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('forensics')
export class ForensicsController {
  constructor(private readonly forensicsService: ForensicsService) {}

  @Roles('SOC_ANALYST', 'INVESTIGATOR', 'ADMIN')
  @Post('artifacts')
  async registerArtifact(@Req() req: any, @Body() dto: CreateArtifactDto) {
    return this.forensicsService.registerArtifact(req.user.id, dto);
  }

  @Get('artifacts')
  async listArtifacts(@Query() query: ArtifactQueryDto) {
    return this.forensicsService.listArtifacts(query);
  }

  @Get('artifacts/:id')
  async getArtifactDetail(@Param('id') id: string) {
    return this.forensicsService.getArtifactDetail(id);
  }

  @Roles('SOC_ANALYST', 'INVESTIGATOR', 'ADMIN')
  @Post('artifacts/:id/verify')
  async verifyIntegrity(@Req() req: any, @Param('id') id: string) {
    return this.forensicsService.verifyIntegrity(id, req.user.id);
  }

  @Roles('ADMIN')
  @Post('artifacts/:id/vt-lookup')
  async lookupVirusTotal(@Param('id') id: string) {
    return this.forensicsService.lookupVirusTotal(id);
  }

  @Roles('SOC_ANALYST', 'INVESTIGATOR', 'ADMIN')
  @Post('artifacts/:id/custody')
  async recordCustodyEvent(@Req() req: any, @Param('id') id: string, @Body() dto: CustodyEventDto) {
    return this.forensicsService.recordCustodyEvent(id, req.user.id, dto);
  }

  @Get('artifacts/:id/custody')
  async getCustodyChain(@Param('id') id: string) {
    return this.forensicsService.getCustodyChain(id);
  }

  @Get('cases/:caseId/artifacts')
  async getArtifactsByCase(@Param('caseId') caseId: string) {
    return this.forensicsService.getArtifactsByCase(caseId);
  }
}
