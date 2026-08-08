import { Module } from '@nestjs/common';
import { GraphThreatService } from './graph-threat.service';
import { GraphController } from './graph.controller';

@Module({
  controllers: [GraphController],
  providers: [GraphThreatService],
  exports: [GraphThreatService],
})
export class GraphModule {}
