import { Module } from '@nestjs/common';
import { SigmaCompilerService } from './sigma-compiler.service';
import { SigmaController } from './sigma.controller';

@Module({
  controllers: [SigmaController],
  providers: [SigmaCompilerService],
  exports: [SigmaCompilerService],
})
export class SigmaModule {}
