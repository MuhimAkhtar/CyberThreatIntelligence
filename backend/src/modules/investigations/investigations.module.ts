import { Module } from '@nestjs/common';
import { InvestigationsController } from './investigations.controller';
import { InvestigationsService } from './investigations.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InvestigationsController],
  providers: [InvestigationsService],
  exports: [InvestigationsService],
})
export class InvestigationsModule {}
