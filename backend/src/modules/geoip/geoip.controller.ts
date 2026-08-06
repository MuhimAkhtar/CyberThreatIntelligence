import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GeoIpService } from './geoip.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller(['geoip', 'dashboard'])
export class GeoIpController {
  constructor(private readonly geoIpService: GeoIpService) {}

  @Get('lookup/:ip')
  lookupIp(@Param('ip') ip: string) {
    return this.geoIpService.lookupIp(ip);
  }

  @Get('attack-map')
  getAttackMapData() {
    return this.geoIpService.getAttackMapData();
  }
}
