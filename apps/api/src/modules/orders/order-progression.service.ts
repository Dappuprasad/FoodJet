import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { isTerminalStatus, nextStatus, type OrderStatus } from '@foodjet/shared';
import { ordersConfig } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderEventsService } from './order-events.service';
import { OrdersService } from './orders.service';
import { ACCEPTANCE_MINUTES, DELIVERY_TRAVEL_MINUTES } from './orders.constants';

const STATUS_NOTES: Partial<Record<OrderStatus, string>> = {
  PREPARING: 'The kitchen has started cooking',
  OUT_FOR_DELIVERY: 'Your rider has picked up the order',
  DELIVERED: 'Delivered — enjoy your meal',
};

/**
 * Drives an order through the kitchen lifecycle on a timer.
 *
 * This stands in for the restaurant-side app a real deployment would have. It
 * lives on the server rather than in the browser so that every viewer of an
 * order sees the same status at the same moment, the progression survives a page
 * refresh, and an admin override actually wins — none of which is true when the
 * client invents its own timeline.
 */
@Injectable()
export class OrderProgressionService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(OrderProgressionService.name);
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private shuttingDown = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly events: OrderEventsService,
    @Inject(ordersConfig.KEY)
    private readonly config: ConfigType<typeof ordersConfig>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.events.onOrderPlaced.subscribe((order) => {
      this.schedule(order.id, order.status);
    });

    // An admin moving an order forward manually should reset the clock for the
    // next hop rather than leaving the old timer to fire on a stale assumption.
    this.events.onStatusChanged.subscribe(({ order }) => {
      this.cancelTimer(order.id);
      if (!isTerminalStatus(order.status)) {
        this.schedule(order.id, order.status);
      }
    });

    await this.resumeInFlightOrders();
  }

  onModuleDestroy(): void {
    this.shuttingDown = true;
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
  }

  /**
   * Restarts timers for orders left mid-flight by a restart or a deploy.
   * Delays are measured from `placedAt`, so an order that should already have
   * advanced while the process was down catches up immediately instead of
   * restarting its clock from zero.
   */
  private async resumeInFlightOrders(): Promise<void> {
    const inFlight = await this.orders.findInFlight();

    for (const order of inFlight) {
      this.schedule(order.id, order.status);
    }

    if (inFlight.length > 0) {
      this.logger.log(`Resumed progression for ${inFlight.length} in-flight order(s)`);
    }
  }

  private schedule(orderId: string, from: OrderStatus): void {
    if (this.shuttingDown) return;

    const target = nextStatus(from);
    if (!target) return;

    this.cancelTimer(orderId);

    void this.computeDelay(orderId, from).then((delayMs) => {
      if (delayMs === null || this.shuttingDown) return;

      const timer = setTimeout(() => {
        this.timers.delete(orderId);
        void this.advance(orderId, from, target);
      }, delayMs);

      // Don't hold the event loop open on shutdown for a pending kitchen timer.
      timer.unref?.();
      this.timers.set(orderId, timer);
    });
  }

  private async advance(
    orderId: string,
    expectedFrom: OrderStatus,
    to: OrderStatus,
  ): Promise<void> {
    try {
      await this.orders.updateStatus(orderId, to, {
        note: STATUS_NOTES[to],
        expectedFrom,
      });
      // The resulting status-changed event schedules the following hop.
    } catch (error) {
      // A cancelled or admin-advanced order legitimately fails the expectedFrom
      // check. That is the guard doing its job, not an error worth alarming on.
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        this.logger.debug(`Skipped auto-advance for ${orderId}: ${error.message}`);
        return;
      }

      this.logger.error(
        `Failed to advance order ${orderId} to ${to}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Milliseconds until the given order should leave `from`, or null if the order
   * has vanished. Prep time is recovered from the delivery estimate that was
   * committed at checkout, so the simulation matches what the customer was told.
   */
  private async computeDelay(orderId: string, from: OrderStatus): Promise<number | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { placedAt: true, estimatedDeliveryAt: true },
    });

    if (!order) return null;

    const totalMinutes =
      (order.estimatedDeliveryAt.getTime() - order.placedAt.getTime()) / 60_000;
    const prepMinutes = Math.max(1, totalMinutes - DELIVERY_TRAVEL_MINUTES);

    const offsets: Record<string, number> = {
      RECEIVED: ACCEPTANCE_MINUTES,
      PREPARING: ACCEPTANCE_MINUTES + prepMinutes,
      OUT_FOR_DELIVERY: ACCEPTANCE_MINUTES + prepMinutes + DELIVERY_TRAVEL_MINUTES,
    };

    const offsetMinutes = offsets[from];
    if (offsetMinutes === undefined) return null;

    const speedup = Math.max(1, this.config.simulationSpeedup);
    const dueAt = order.placedAt.getTime() + (offsetMinutes * 60_000) / speedup;

    return Math.max(0, dueAt - Date.now());
  }

  private cancelTimer(orderId: string): void {
    const timer = this.timers.get(orderId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(orderId);
    }
  }
}
