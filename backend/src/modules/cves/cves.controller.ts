import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { CvesService } from './cves.service';
import { CveQueryDto } from './dto/cve-query.dto';
import { NvdSyncService } from './nvd-sync.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('cves')
export class CvesController {
  constructor(
    private readonly cvesService: CvesService,
    private readonly nvdSyncService: NvdSyncService,
  ) {}

  @Get()
  findAll(@Query() query: CveQueryDto) {
    return this.cvesService.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.cvesService.getStats();
  }

  @Get(':cveId')
  findOne(@Param('cveId') cveId: string) {
    return this.cvesService.findOne(cveId);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('sync')
  sync() {
    return this.nvdSyncService.syncFromNvd();
  }
}
