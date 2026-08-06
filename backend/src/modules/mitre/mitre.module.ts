import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MitreService } from './mitre.service';
import { MitreController } from './mitre.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MitreController],
  providers: [MitreService],
  exports: [MitreService],
})
export class MitreModule {}
