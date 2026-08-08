import { Module } from '@nestjs/common';
import { HaHealthMonitorService } from './ha-health-monitor.service';
import { HaController } from './ha.controller';

@Module({
  controllers: [HaController],
  providers: [HaHealthMonitorService],
  exports: [HaHealthMonitorService],
})
export class HaModule {}
