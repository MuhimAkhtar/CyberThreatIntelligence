import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { GeminiService } from './gemini.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [ReportingController],
  providers: [ReportingService, GeminiService],
  exports: [ReportingService],
})
export class ReportingModule {}
