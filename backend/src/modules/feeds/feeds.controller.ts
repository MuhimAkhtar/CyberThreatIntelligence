import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { FeedsService } from './feeds.service';
import { CreateFeedDto } from './dto/create-feed.dto';
import { UpdateFeedDto } from './dto/update-feed.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FeedSyncService } from './feed-sync.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('feeds')
export class FeedsController {
  constructor(
    private readonly feedsService: FeedsService,
    private readonly feedSyncService: FeedSyncService,
  ) {}

  @Roles('ADMIN', 'SOC_ANALYST')
  @Get()
  findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
  ) {
    return this.feedsService.findAll(skip, take);
  }

  @Roles('ADMIN', 'SOC_ANALYST')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feedsService.findOne(id);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() createFeedDto: CreateFeedDto) {
    return this.feedsService.create(createFeedDto);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFeedDto: UpdateFeedDto) {
    return this.feedsService.update(id, updateFeedDto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feedsService.remove(id);
  }

  @Roles('ADMIN')
  @Post(':id/sync')
  sync(@Param('id') id: string) {
    return this.feedSyncService.syncFeed(id);
  }

  @Roles('ADMIN', 'SOC_ANALYST')
  @Get(':id/logs')
  getSyncLogs(
    @Param('id') id: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
  ) {
    return this.feedsService.getSyncLogs(id, skip, take);
  }
}
