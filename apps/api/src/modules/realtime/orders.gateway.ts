import { Logger, type OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import {
  ORDERS_NAMESPACE,
  SOCKET_EVENTS,
  orderRoom,
  type ClientToServerEvents,
  type ServerToClientEvents,
  type SubscribeToOrderPayload,
} from '@foodjet/shared';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuthService } from '../auth/auth.service';
import { OrdersService } from '../orders/orders.service';
import { OrderEventsService } from '../orders/order-events.service';

interface SocketData {
  user?: AuthenticatedUser;
}

type OrdersServer = Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>;
type OrdersSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>;

const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

/**
 * Pushes live order status to whoever is watching a given order.
 *
 * Clients join one room per order id, so a status change costs a single emit to
 * exactly the interested sockets rather than a broadcast every listener has to
 * filter. Subscribing is read-only — nothing a client sends can move an order.
 */
@WebSocketGateway({
  namespace: ORDERS_NAMESPACE,
  cors: { origin: allowedOrigins, credentials: true },
})
export class OrdersGateway
  implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(OrdersGateway.name);

  @WebSocketServer()
  private readonly server!: OrdersServer;

  constructor(
    private readonly orders: OrdersService,
    private readonly events: OrderEventsService,
    private readonly auth: AuthService,
  ) {}

  onModuleInit(): void {
    this.events.onStatusChanged.subscribe(({ order, event }) => {
      this.server.to(orderRoom(order.id)).emit(SOCKET_EVENTS.statusChanged, {
        orderId: order.id,
        status: order.status,
        estimatedDeliveryAt: order.estimatedDeliveryAt,
        event,
      });

      this.logger.debug(`Broadcast ${order.reference} -> ${order.status}`);
    });
  }

  /**
   * Resolves the caller once, at handshake time, from the same bearer token the
   * REST API uses. Without this a signed-in customer could not watch their own
   * order: the ownership check below would see an anonymous socket and refuse.
   */
  async handleConnection(client: OrdersSocket): Promise<void> {
    const raw = client.handshake.auth?.token as string | undefined;
    const token = raw?.startsWith('Bearer ') ? raw.slice(7) : raw;

    client.data.user = await this.auth.verifyAccessToken(token);
    this.logger.debug(
      `Socket connected: ${client.id}${client.data.user ? ` (${client.data.user.email})` : ''}`,
    );
  }

  handleDisconnect(client: OrdersSocket): void {
    this.logger.debug(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage(SOCKET_EVENTS.subscribe)
  async subscribe(
    @ConnectedSocket() client: OrdersSocket,
    @MessageBody() payload: SubscribeToOrderPayload,
  ): Promise<void> {
    const orderId = payload?.orderId;

    if (!orderId || typeof orderId !== 'string') {
      client.emit(SOCKET_EVENTS.error, { message: 'An order id is required' });
      return;
    }

    try {
      // Reuses the HTTP authorisation rules: a socket cannot see an order the
      // same caller could not have fetched over REST.
      const order = await this.orders.findById(orderId, client.data.user);

      await client.join(orderRoom(orderId));
      client.emit(SOCKET_EVENTS.snapshot, { order });
    } catch {
      client.emit(SOCKET_EVENTS.error, { message: 'Order not found' });
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.unsubscribe)
  async unsubscribe(
    @ConnectedSocket() client: OrdersSocket,
    @MessageBody() payload: SubscribeToOrderPayload,
  ): Promise<void> {
    if (payload?.orderId) {
      await client.leave(orderRoom(payload.orderId));
    }
  }
}
