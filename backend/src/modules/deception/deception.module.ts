import { Module } from '@nestjs/common';
import { HoneypotListenerService } from './honeypot-listener.service';
import { DeceptionController } from './deception.controller';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [KafkaModule],
  controllers: [DeceptionController],
  providers: [HoneypotListenerService],
  exports: [HoneypotListenerService],
})
export class DeceptionModule {}
