import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  calculatePricing,
  canTransition,
  ORDER_STATUS_LABELS,
  type Order,
  type OrderStatus,
  type Paginated,
} from '@foodjet/shared';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { MenuService } from '../menu/menu.service';
import { OrderEventsService } from './order-events.service';
import { DELIVERY_TRAVEL_MINUTES } from './orders.constants';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { OrderQueryDto } from './dto/order-query.dto';
import {
  ORDER_INCLUDE,
  generateOrderReference,
  toOrder,
  type OrderRecord,
} from './orders.mapper';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly menu: MenuService,
    private readonly events: OrderEventsService,
  ) {}

  /**
   * Prices and persists an order.
   *
   * The client sends menu item ids and quantities and nothing else — no prices,
   * no totals. Every figure on the order is recomputed here from the database,
   * because a total that arrived over the wire is a number the customer chose.
   */
  async create(dto: CreateOrderDto, user?: AuthenticatedUser): Promise<Order> {
    const requestedIds = dto.items.map((item) => item.menuItemId);

    if (new Set(requestedIds).size !== requestedIds.length) {
      throw new BadRequestException('Each dish may only appear once — use quantity instead');
    }

    const available = await this.menu.findAvailableByIds(requestedIds);
    const missing = requestedIds.filter((id) => !available.has(id));

    if (missing.length > 0) {
      throw new UnprocessableEntityException(
        missing.length === requestedIds.length
          ? 'None of the dishes in your cart are available right now'
          : `${missing.length} dish(es) in your cart are no longer available`,
      );
    }

    const lines = dto.items.map((item) => {
      // Non-null assertion is safe: `missing` above proved every id resolves.
      const menuItem = available.get(item.menuItemId)!;
      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        imageUrl: menuItem.imageUrl,
        unitPricePaise: menuItem.pricePaise,
        quantity: item.quantity,
        lineTotalPaise: menuItem.pricePaise * item.quantity,
        preparationMinutes: menuItem.preparationMinutes,
      };
    });

    const pricing = calculatePricing(lines);

    // The kitchen works dishes in parallel, so the slowest one sets the pace.
    const prepMinutes = Math.max(...lines.map((line) => line.preparationMinutes));
    const estimatedDeliveryAt = new Date(
      Date.now() + (prepMinutes + DELIVERY_TRAVEL_MINUTES) * 60_000,
    );

    const record = await this.createWithUniqueReference((reference) =>
      this.prisma.order.create({
        data: {
          reference,
          userId: user?.id ?? null,
          status: 'RECEIVED',
          customerName: dto.customerName,
          phone: dto.phone,
          addressLine: dto.addressLine,
          deliveryNotes: dto.deliveryNotes ?? null,
          subtotalPaise: pricing.subtotalPaise,
          deliveryFeePaise: pricing.deliveryFeePaise,
          taxPaise: pricing.taxPaise,
          totalPaise: pricing.totalPaise,
          estimatedDeliveryAt,
          items: {
            create: lines.map(({ preparationMinutes: _prep, ...line }) => line),
          },
          timeline: {
            create: { status: 'RECEIVED', note: 'We have your order' },
          },
        },
        include: ORDER_INCLUDE,
      }),
    );

    this.logger.log(
      `Order ${record.reference} placed - ${lines.length} line(s), ${pricing.totalPaise} paise`,
    );

    const order = toOrder(record);
    this.events.publishOrderPlaced(order);

    return order;
  }

  async findById(id: string, requester?: AuthenticatedUser): Promise<Order> {
    const record = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });

    if (!record) throw new NotFoundException('Order not found');

    this.assertCanView(record, requester);
    return toOrder(record);
  }

  async findByReference(reference: string, requester?: AuthenticatedUser): Promise<Order> {
    const record = await this.prisma.order.findUnique({
      where: { reference: reference.toUpperCase() },
      include: ORDER_INCLUDE,
    });

    if (!record) throw new NotFoundException('Order not found');

    this.assertCanView(record, requester);
    return toOrder(record);
  }

  async findForUser(userId: string, query: OrderQueryDto): Promise<Paginated<Order>> {
    return this.paginate({ userId, ...(query.status ? { status: query.status } : {}) }, query);
  }

  async findAll(query: OrderQueryDto): Promise<Paginated<Order>> {
    return this.paginate(query.status ? { status: query.status } : {}, query);
  }

  /**
   * Applies a status change if the state machine allows it.
   *
   * `expectedFrom` lets the automatic progression say "advance this order only
   * if it is still where I left it". Without that check a background timer could
   * silently undo an admin who cancelled the order a moment earlier.
   */
  async updateStatus(
    id: string,
    status: OrderStatus,
    options: { note?: string; expectedFrom?: OrderStatus } = {},
  ): Promise<Order> {
    const current = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!current) throw new NotFoundException('Order not found');

    if (options.expectedFrom && current.status !== options.expectedFrom) {
      throw new ConflictException('Order has already moved on');
    }

    if (current.status === status) {
      throw new ConflictException(`Order is already ${ORDER_STATUS_LABELS[status]}`);
    }

    if (!canTransition(current.status, status)) {
      throw new ConflictException(
        `Cannot move an order from ${ORDER_STATUS_LABELS[current.status]} to ${ORDER_STATUS_LABELS[status]}`,
      );
    }

    const record = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        timeline: { create: { status, note: options.note ?? null } },
      },
      include: ORDER_INCLUDE,
    });

    const order = toOrder(record);
    const latest = order.timeline[order.timeline.length - 1];

    if (latest) {
      this.events.publishStatusChanged({ order, event: latest });
    }

    return order;
  }

  /** Cancellation is a customer-facing action, so it checks ownership. */
  async cancel(id: string, requester: AuthenticatedUser): Promise<Order> {
    const record = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });

    if (!record) throw new NotFoundException('Order not found');

    if (requester.role !== 'ADMIN' && record.userId !== requester.id) {
      throw new ForbiddenException('This order belongs to a different account');
    }

    if (!canTransition(record.status, 'CANCELLED')) {
      throw new ConflictException(
        record.status === 'OUT_FOR_DELIVERY'
          ? 'Your order is already on its way and can no longer be cancelled'
          : `A ${ORDER_STATUS_LABELS[record.status].toLowerCase()} order cannot be cancelled`,
      );
    }

    return this.updateStatus(id, 'CANCELLED', { note: 'Cancelled by customer' });
  }

  /** Orders still mid-flight, used to restart progression timers after a deploy. */
  async findInFlight(): Promise<Array<{ id: string; status: OrderStatus; placedAt: Date }>> {
    return this.prisma.order.findMany({
      where: { status: { in: ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY'] } },
      select: { id: true, status: true, placedAt: true },
      orderBy: { placedAt: 'asc' },
    });
  }

  private async paginate(
    where: Prisma.OrderWhereInput,
    query: OrderQueryDto,
  ): Promise<Paginated<Order>> {
    const { page, pageSize } = query;

    const [records, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { placedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: records.map(toOrder),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  /**
   * Guest orders are readable by anyone holding the id — that is what makes the
   * emailed tracking link work without an account. Orders attached to an account
   * are not: those are restricted to their owner and to admins.
   */
  private assertCanView(
    record: { userId: string | null },
    requester?: AuthenticatedUser,
  ): void {
    if (!record.userId) return;
    if (requester?.role === 'ADMIN') return;
    if (requester?.id === record.userId) return;

    throw new ForbiddenException('This order belongs to a different account');
  }

  /** References are random, so a collision is rare but not impossible. Retry. */
  private async createWithUniqueReference(
    create: (reference: string) => Promise<OrderRecord>,
  ): Promise<OrderRecord> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await create(generateOrderReference());
      } catch (error) {
        // Prisma reports the conflicting column(s) as either a string or an
        // array depending on the connector, so normalise before matching.
        const target =
          error instanceof Prisma.PrismaClientKnownRequestError
            ? error.meta?.target
            : undefined;
        const targetColumns = Array.isArray(target)
          ? target.map(String)
          : typeof target === 'string'
            ? [target]
            : [];

        const isReferenceClash =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          targetColumns.some((column) => column.includes('reference'));

        if (!isReferenceClash) throw error;
        this.logger.warn(`Order reference collision on attempt ${attempt + 1}`);
      }
    }

    throw new ConflictException('Could not allocate an order reference. Please retry.');
  }
}
