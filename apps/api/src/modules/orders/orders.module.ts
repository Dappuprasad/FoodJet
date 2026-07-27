import { Module } from '@nestjs/common';
import { MenuModule } from '../menu/menu.module';
import { OrderProgressionService } from './order-progression.service';
import { AdminOrdersController, OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [MenuModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService, OrderProgressionService],
  exports: [OrdersService],
})
export class OrdersModule {}
