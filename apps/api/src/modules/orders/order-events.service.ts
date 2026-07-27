import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import type { Order, OrderStatusEvent } from '@foodjet/shared';

export interface OrderStatusChanged {
  order: Order;
  event: OrderStatusEvent;
}

/**
 * A one-way bus between the orders domain and the WebSocket gateway.
 *
 * Without it OrdersService would have to import the gateway and the gateway
 * would have to import OrdersService to build snapshots — a circular dependency
 * that only forwardRef() can paper over. Publishing to a Subject keeps the
 * domain layer unaware that a transport called "sockets" exists at all.
 */
@Injectable()
export class OrderEventsService {
  private readonly statusChanged$ = new Subject<OrderStatusChanged>();
  private readonly orderPlaced$ = new Subject<Order>();

  readonly onStatusChanged = this.statusChanged$.asObservable();
  readonly onOrderPlaced = this.orderPlaced$.asObservable();

  publishStatusChanged(payload: OrderStatusChanged): void {
    this.statusChanged$.next(payload);
  }

  publishOrderPlaced(order: Order): void {
    this.orderPlaced$.next(order);
  }
}
