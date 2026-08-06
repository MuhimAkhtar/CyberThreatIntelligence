import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SiemService } from './siem.service';
import { SiemController } from './siem.controller';
import { CefFormatter } from './formatters/cef.formatter';
import { SplunkHecConnector } from './connectors/splunk-hec.connector';
import { WazuhConnector } from './connectors/wazuh.connector';
import { WebhookConnector } from './connectors/webhook.connector';

@Module({
  imports: [PrismaModule],
  controllers: [SiemController],
  providers: [
    SiemService,
    CefFormatter,
    SplunkHecConnector,
    WazuhConnector,
    WebhookConnector,
  ],
  exports: [SiemService],
})
export class SiemModule {}
