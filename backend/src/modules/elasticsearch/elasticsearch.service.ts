import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import { IOC_INDEX_MAPPING } from './mappings/ioc.mapping';
import { CVE_INDEX_MAPPING } from './mappings/cve.mapping';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);
  private client: Client;

  constructor(private readonly configService: ConfigService) {
    const node = this.configService.get<string>('elasticsearch.node');
    this.client = new Client({
      node: node || 'http://localhost:9200',
    });
  }

  async onModuleInit() {
    try {
      const health = await this.client.cluster.health();
      this.logger.log(`Elasticsearch cluster is ${health.status}`);

      await this.initIndices();
    } catch (error) {
      this.logger.error('Failed to connect to Elasticsearch', error);
    }
  }

  private async initIndices() {
    await this.createIndex('ctp-iocs', IOC_INDEX_MAPPING);
    await this.createIndex('ctp-cves', CVE_INDEX_MAPPING);
  }

  async createIndex(name: string, mapping: any) {
    try {
      const exists = await this.client.indices.exists({ index: name });
      if (!exists) {
        await this.client.indices.create({
          index: name,
          mappings: mapping,
        });
        this.logger.log(`Created Elasticsearch index: ${name}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create index ${name}`, error);
    }
  }

  async index(indexName: string, id: string, document: any) {
    try {
      return await this.client.index({
        index: indexName,
        id,
        document,
      });
    } catch (error) {
      this.logger.error(`Failed to index document in ${indexName}`, error);
      throw error;
    }
  }

  async bulk(indexName: string, documents: any[]) {
    try {
      const operations = documents.flatMap(doc => [
        { index: { _index: indexName, _id: doc.id } },
        doc,
      ]);
      return await this.client.bulk({ refresh: true, operations });
    } catch (error) {
      this.logger.error(`Failed to bulk index in ${indexName}`, error);
      throw error;
    }
  }

  async search(indexName: string, queryOrParams: any) {
    try {
      const searchBody = queryOrParams?.query
        ? { index: indexName, ...queryOrParams }
        : { index: indexName, query: queryOrParams };
      const result = await this.client.search(searchBody);
      return result.hits;
    } catch (error) {
      this.logger.error(`Failed to search in ${indexName}`, error);
      throw error;
    }
  }

  async deleteIndex(name: string) {
    try {
      await this.client.indices.delete({ index: name });
      this.logger.log(`Deleted Elasticsearch index: ${name}`);
    } catch (error) {
      this.logger.error(`Failed to delete index ${name}`, error);
      throw error;
    }
  }
}
