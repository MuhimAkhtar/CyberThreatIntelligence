import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { ForensicsService } from './forensics.service';
import { ForensicsController } from './forensics.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [ForensicsController],
  providers: [ForensicsService],
  exports: [ForensicsService],
})
export class ForensicsModule {}
