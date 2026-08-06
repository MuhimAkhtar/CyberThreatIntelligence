import { Module } from '@nestjs/common';
import { GeoIpController } from './geoip.controller';
import { GeoIpService } from './geoip.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GeoIpController],
  providers: [GeoIpService],
  exports: [GeoIpService],
})
export class GeoIpModule {}
