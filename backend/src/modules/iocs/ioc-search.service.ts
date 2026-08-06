import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { IocQueryDto } from './dto/ioc-query.dto';

@Injectable()
export class IocSearchService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async search(query: IocQueryDto) {
    const esQuery: any = {
      bool: {
        must: [],
        filter: [],
        should: [],
      },
    };

    if (query.value) {
      if (['IP_ADDRESS', 'HASH_MD5', 'HASH_SHA1', 'HASH_SHA256'].includes(query.type as any) || !query.type) {
        esQuery.bool.should.push({ term: { 'value.keyword': query.value } });
      }
      esQuery.bool.should.push({ wildcard: { value: `*${query.value}*` } });
      esQuery.bool.minimum_should_match = 1;
    }

    if (query.type) esQuery.bool.filter.push({ term: { type: query.type } });
    if (query.feedId) esQuery.bool.filter.push({ term: { feedId: query.feedId } });

    if (query.minConfidence || query.maxConfidence) {
      const confRange: any = {};
      if (query.minConfidence) confRange.gte = query.minConfidence;
      if (query.maxConfidence) confRange.lte = query.maxConfidence;
      esQuery.bool.filter.push({ range: { confidenceScore: confRange } });
    }

    if (query.firstSeenAfter || query.firstSeenBefore) {
      const dateRange: any = {};
      if (query.firstSeenAfter) dateRange.gte = query.firstSeenAfter;
      if (query.firstSeenBefore) dateRange.lte = query.firstSeenBefore;
      esQuery.bool.filter.push({ range: { firstSeenAt: dateRange } });
    }

    const searchParams = {
      query: esQuery,
      from: query.skip || 0,
      size: query.take || 20,
      highlight: {
        fields: {
          value: {}
        }
      }
    };

    return this.elasticsearchService.search('ctp-iocs', searchParams);
  }
}
