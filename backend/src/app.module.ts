import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { KafkaModule } from './modules/kafka/kafka.module';
import { ElasticsearchCustomModule } from './modules/elasticsearch/elasticsearch.module';
import { FeedsModule } from './modules/feeds/feeds.module';
import { CvesModule } from './modules/cves/cves.module';
import { IocsModule } from './modules/iocs/iocs.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { MalwareModule } from './modules/malware/malware.module';
import { DetectionModule } from './modules/detection/detection.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { InvestigationsModule } from './modules/investigations/investigations.module';
import { GeoIpModule } from './modules/geoip/geoip.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { ForensicsModule } from './modules/forensics/forensics.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { MitreModule } from './modules/mitre/mitre.module';
import { SiemModule } from './modules/siem/siem.module';
import { PlaybooksModule } from './modules/playbooks/playbooks.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    KafkaModule,
    ElasticsearchCustomModule,
    FeedsModule,
    CvesModule,
    IocsModule,
    AlertsModule,
    MalwareModule,
    DetectionModule,
    RealtimeModule,
    InvestigationsModule,
    GeoIpModule,
    TimelineModule,
    ForensicsModule,
    ReportingModule,
    MitreModule,
    SiemModule,
    PlaybooksModule,
    NotificationsModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      name: 'default',
      ttl: 60000,
      limit: 30,
    }]),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
