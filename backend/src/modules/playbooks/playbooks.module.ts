import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlaybooksService } from './playbooks.service';
import { PlaybookEngine } from './playbook-engine';
import { PlaybooksController } from './playbooks.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PlaybooksController],
  providers: [PlaybooksService, PlaybookEngine],
  exports: [PlaybooksService, PlaybookEngine]
})
export class PlaybooksModule {}
