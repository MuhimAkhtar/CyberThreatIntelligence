import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertQueryDto } from './dto/alert-query.dto';
import { UpdateAlertStatusDto, AssignAlertDto } from './dto/update-alert-status.dto';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get('alerts')
  findAll(@Query() query: AlertQueryDto) {
    return this.alertsService.findAll(query);
  }

  @Get('alerts/stats')
  getStats() {
    return this.alertsService.getStats();
  }

  @Get('alerts/:id')
  findOne(@Param('id') id: string) {
    return this.alertsService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles('SOC_ANALYST', 'ADMIN')
  @Patch('alerts/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAlertStatusDto) {
    return this.alertsService.updateStatus(id, dto.status);
  }

  @UseGuards(RolesGuard)
  @Roles('SOC_ANALYST', 'ADMIN')
  @Patch('alerts/:id/assign')
  assignAlert(@Param('id') id: string, @Body() dto: AssignAlertDto) {
    return this.alertsService.assignAlert(id, dto.assignedToUserId);
  }

  // --- Alert Rules ---

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('alert-rules')
  findAllRules() {
    return this.alertsService.findAllRules();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('alert-rules')
  createRule(@Body() dto: CreateAlertRuleDto) {
    return this.alertsService.createRule(dto);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch('alert-rules/:id')
  updateRule(@Param('id') id: string, @Body() body: any) {
    return this.alertsService.updateRule(id, body);
  }
}
