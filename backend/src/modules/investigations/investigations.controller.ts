import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InvestigationsService } from './investigations.service';
import { CreateInvestigationDto } from './dto/create-investigation.dto';
import { InvestigationQueryDto, UpdateCaseStatusDto, AddCaseNoteDto } from './dto/investigation-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller(['cases', 'investigations'])
export class InvestigationsController {
  constructor(private readonly investigationsService: InvestigationsService) {}

  @Get()
  findAll(@Query() query: InvestigationQueryDto) {
    return this.investigationsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.investigationsService.findOne(id);
  }

  @Get(':id/timeline')
  getCaseTimeline(@Param('id') id: string) {
    return this.investigationsService.getCaseTimeline(id);
  }

  @UseGuards(RolesGuard)
  @Roles('SOC_ANALYST', 'INVESTIGATOR', 'ADMIN')
  @Post()
  createCase(@Req() req: any, @Body() dto: CreateInvestigationDto) {
    const userId = req.user.id;
    return this.investigationsService.createCase(userId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('SOC_ANALYST', 'INVESTIGATOR', 'ADMIN')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateCaseStatusDto) {
    return this.investigationsService.updateStatus(id, dto.status);
  }

  @UseGuards(RolesGuard)
  @Roles('SOC_ANALYST', 'INVESTIGATOR', 'ADMIN')
  @Post(':id/notes')
  addNote(@Req() req: any, @Param('id') id: string, @Body() dto: AddCaseNoteDto) {
    const userId = req.user.id;
    return this.investigationsService.addNote(id, userId, dto.content);
  }

  @UseGuards(RolesGuard)
  @Roles('SOC_ANALYST', 'INVESTIGATOR', 'ADMIN')
  @Post(':id/alerts/:alertId')
  linkAlertToCase(@Param('id') caseId: string, @Param('alertId') alertId: string) {
    return this.investigationsService.linkAlertToCase(caseId, alertId);
  }
}
