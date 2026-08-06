import { Module } from '@nestjs/common';
import { IocsService } from './iocs.service';
import { IocsController } from './iocs.controller';
import { IocSearchService } from './ioc-search.service';
import { ElasticsearchCustomModule } from '../elasticsearch/elasticsearch.module';

@Module({
  imports: [ElasticsearchCustomModule],
  controllers: [IocsController],
  providers: [IocsService, IocSearchService],
  exports: [IocsService],
})
export class IocsModule {}
