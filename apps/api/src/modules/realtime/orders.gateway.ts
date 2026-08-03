import { Logger, type OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace, Server, Socket } from 'socket.io';
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
type OrdersNamespace = Namespace<
  ClientToServerEvents,
  ServerToClientEvents,
  never,
  SocketData
>;

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
  implements OnModuleInit, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
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
   * Resolves the caller from the same bearer token the REST API uses.
   *
   * This has to be namespace middleware rather than `handleConnection`.
   * Socket.IO awaits middleware before the connection is established and before
   * any message is dispatched; it does not await `handleConnection`. Since
   * resolving a token involves a database lookup, doing it there raced against
   * clients that subscribe immediately on `connect` — the subscribe handler
   * would see an anonymous socket and refuse the user access to their own order.
   */
  afterInit(server: OrdersNamespace): void {
    server.use((socket, next) => {
      const raw = socket.handshake.auth?.token as string | undefined;
      const token = raw?.startsWith('Bearer ') ? raw.slice(7) : raw;

      void this.auth
        .verifyAccessToken(token)
        .then((user) => {
          socket.data.user = user;
          next();
        })
        // A bad or expired token connects anonymously rather than being
        // rejected, so guest tracking links keep working.
        .catch(() => next());
    });
  }

  handleConnection(client: OrdersSocket): void {
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
