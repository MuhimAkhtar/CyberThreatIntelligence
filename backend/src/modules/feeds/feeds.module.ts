import { Module } from '@nestjs/common';
import { FeedsService } from './feeds.service';
import { FeedsController } from './feeds.controller';
import { FeedSyncService } from './feed-sync.service';
import { FeedSchedulerService } from './feed-scheduler.service';
import { ConnectorFactory } from './connectors/connector-factory';
import { StixNormalizerService } from './normalizers/stix-normalizer.service';
import { KafkaModule } from '../kafka/kafka.module';
import { ElasticsearchCustomModule } from '../elasticsearch/elasticsearch.module';

import { Taxii2Controller } from './taxii2.controller';

@Module({
  imports: [KafkaModule, ElasticsearchCustomModule],
  controllers: [FeedsController, Taxii2Controller],
  providers: [
    FeedsService,
    FeedSyncService,
    FeedSchedulerService,
    ConnectorFactory,
    StixNormalizerService,
  ],
  exports: [FeedsService],
})
export class FeedsModule {}
