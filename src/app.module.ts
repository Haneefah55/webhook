import { Module } from '@nestjs/common';
import { IngressController } from './ingress.controller';
import { WaaSDispatcherService } from './dispatcher.service';

@Module({
  imports: [],
  controllers: [IngressController],
  providers: [WaaSDispatcherService],
})
export class AppModule {}
