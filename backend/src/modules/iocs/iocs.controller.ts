import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { IocsService } from './iocs.service';
import { IocSearchService } from './ioc-search.service';
import { IocQueryDto } from './dto/ioc-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('iocs')
export class IocsController {
  constructor(
    private readonly iocsService: IocsService,
    private readonly iocSearchService: IocSearchService,
  ) {}

  @Get()
  findAll(@Query() query: IocQueryDto) {
    return this.iocsService.findAll(query);
  }

  @Get('search')
  search(@Query() query: IocQueryDto) {
    return this.iocSearchService.search(query);
  }

  @Get('stats')
  getStats() {
    return this.iocsService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.iocsService.findOne(id);
  }
}
