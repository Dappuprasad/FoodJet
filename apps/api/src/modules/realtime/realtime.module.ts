import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { OrdersGateway } from './orders.gateway';

@Module({
  imports: [OrdersModule, AuthModule],
  providers: [OrdersGateway],
})
export class RealtimeModule {}
