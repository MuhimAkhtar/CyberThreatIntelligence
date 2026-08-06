import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PlaybooksService } from './playbooks.service';
import { CreatePlaybookDto } from './dto/create-playbook.dto';
import { UpdatePlaybookDto } from './dto/update-playbook.dto';
import { PlaybookQueryDto } from './dto/playbook-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('playbooks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlaybooksController {
  constructor(private readonly playbooksService: PlaybooksService) {}

  @Post()
  @Roles('SOC_ANALYST', 'INVESTIGATOR', 'ADMIN')
  async createPlaybook(@Req() req: any, @Body() dto: CreatePlaybookDto) {
    return this.playbooksService.createPlaybook(req.user.id, dto);
  }

  @Get()
  async listPlaybooks(@Query() query: PlaybookQueryDto) {
    return this.playbooksService.listPlaybooks(query);
  }

  @Get(':id')
  async getPlaybook(@Param('id') id: string) {
    return this.playbooksService.getPlaybook(id);
  }

  @Patch(':id')
  @Roles('SOC_ANALYST', 'INVESTIGATOR', 'ADMIN')
  async updatePlaybook(@Param('id') id: string, @Body() dto: UpdatePlaybookDto) {
    return this.playbooksService.updatePlaybook(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async deletePlaybook(@Param('id') id: string) {
    return this.playbooksService.deletePlaybook(id);
  }

  @Post(':id/activate')
  @Roles('ADMIN')
  async activatePlaybook(@Param('id') id: string) {
    return this.playbooksService.activatePlaybook(id);
  }

  @Post(':id/deactivate')
  @Roles('ADMIN')
  async deactivatePlaybook(@Param('id') id: string) {
    return this.playbooksService.deactivatePlaybook(id);
  }

  @Post(':id/execute')
  @Roles('SOC_ANALYST', 'INVESTIGATOR', 'ADMIN')
  async executePlaybook(
    @Param('id') id: string,
    @Body() body: { triggeredBy: string; context?: any }
  ) {
    return this.playbooksService.executePlaybook(id, body.triggeredBy, body.context);
  }

  @Get(':id/executions')
  async getExecutionHistory(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.playbooksService.getExecutionHistory(id, pageNum, limitNum);
  }
}
