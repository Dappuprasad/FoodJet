import type { Order, OrderStatusEvent } from './types.js';

/** Socket.IO namespace the order gateway listens on. */
export const ORDERS_NAMESPACE = '/orders';

/** Room name an order's subscribers are joined to. */
export function orderRoom(orderId: string): string {
  return `order:${orderId}`;
}

export const SOCKET_EVENTS = {
  subscribe: 'order:subscribe',
  unsubscribe: 'order:unsubscribe',
  snapshot: 'order:snapshot',
  statusChanged: 'order:status-changed',
  error: 'order:error',
} as const;

export interface SubscribeToOrderPayload {
  orderId: string;
}

export interface OrderSnapshotPayload {
  order: Order;
}

export interface OrderStatusChangedPayload {
  orderId: string;
  status: Order['status'];
  estimatedDeliveryAt: string;
  event: OrderStatusEvent;
}

export interface SocketErrorPayload {
  message: string;
}

/** Events the server emits to clients. */
export interface ServerToClientEvents {
  [SOCKET_EVENTS.snapshot]: (payload: OrderSnapshotPayload) => void;
  [SOCKET_EVENTS.statusChanged]: (payload: OrderStatusChangedPayload) => void;
  [SOCKET_EVENTS.error]: (payload: SocketErrorPayload) => void;
}

/** Events clients emit to the server. */
export interface ClientToServerEvents {
  [SOCKET_EVENTS.subscribe]: (payload: SubscribeToOrderPayload) => void;
  [SOCKET_EVENTS.unsubscribe]: (payload: SubscribeToOrderPayload) => void;
}
