import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { NvdSyncService } from './nvd-sync.service';

@Injectable()
export class NvdSyncScheduler {
  private readonly logger = new Logger(NvdSyncScheduler.name);
  private lastSync: Date | null = null;
  private isSyncing = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly nvdSyncService: NvdSyncService,
  ) {}

  @Cron(CronExpression.EVERY_2_HOURS)
  async handleCron() {
    if (!this.configService.get('nvd.baseUrl')) return;
    if (this.isSyncing) return;

    this.isSyncing = true;
    try {
      const since = this.lastSync || new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await this.nvdSyncService.syncFromNvd(since);
      this.logger.log(`NVD Sync complete: ${result.created} created, ${result.updated} updated`);
      this.lastSync = new Date();
    } catch (e) {
      this.logger.error('NVD sync scheduled job failed', e);
    } finally {
      this.isSyncing = false;
    }
  }
}
