import { Module } from '@nestjs/common';
import { CvesService } from './cves.service';
import { CvesController } from './cves.controller';
import { NvdSyncService } from './nvd-sync.service';
import { NvdSyncScheduler } from './nvd-sync.scheduler';
import { KafkaModule } from '../kafka/kafka.module';
import { ElasticsearchCustomModule } from '../elasticsearch/elasticsearch.module';

@Module({
  imports: [KafkaModule, ElasticsearchCustomModule],
  controllers: [CvesController],
  providers: [CvesService, NvdSyncService, NvdSyncScheduler],
  exports: [CvesService],
})
export class CvesModule {}
