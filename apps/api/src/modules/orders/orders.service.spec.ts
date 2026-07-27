import { BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { MenuItem } from '@prisma/client';
import { rupeesToPaise } from '@foodjet/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { MenuService } from '../menu/menu.service';
import { OrderEventsService } from './order-events.service';
import { OrdersService } from './orders.service';
import type { CreateOrderDto } from './dto/create-order.dto';

const BUTTER_CHICKEN_ID = '11111111-1111-4111-8111-111111111111';
const SAMOSA_ID = '22222222-2222-4222-8222-222222222222';

function menuItem(overrides: Partial<MenuItem> & Pick<MenuItem, 'id'>): MenuItem {
  return {
    slug: 'dish',
    name: 'Dish',
    description: 'A dish',
    pricePaise: rupeesToPaise(100),
    imageUrl: '/images/dish.jpg',
    category: 'Main Course',
    isVegetarian: true,
    spiceLevel: 1,
    preparationMinutes: 20,
    rating: 4.5,
    ratingCount: 10,
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const BUTTER_CHICKEN = menuItem({
  id: BUTTER_CHICKEN_ID,
  slug: 'butter-chicken',
  name: 'Butter Chicken',
  imageUrl: '/images/butter-chicken.jpg',
  pricePaise: rupeesToPaise(320),
  preparationMinutes: 25,
});

const SAMOSA = menuItem({
  id: SAMOSA_ID,
  slug: 'samosa',
  name: 'Samosa',
  pricePaise: rupeesToPaise(40),
  preparationMinutes: 12,
});

function baseDto(items: CreateOrderDto['items']): CreateOrderDto {
  return {
    customerName: 'Rahul Sharma',
    phone: '9876543210',
    addressLine: '42, MG Road, Koramangala, Bangalore 560034',
    items,
  };
}

describe('OrdersService.create', () => {
  let service: OrdersService;
  let createSpy: jest.Mock;
  let findAvailableByIds: jest.Mock;

  beforeEach(async () => {
    createSpy = jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({
        id: 'order-1',
        reference: data.reference,
        userId: data.userId ?? null,
        status: 'RECEIVED',
        customerName: data.customerName,
        phone: data.phone,
        addressLine: data.addressLine,
        deliveryNotes: data.deliveryNotes ?? null,
        subtotalPaise: data.subtotalPaise,
        deliveryFeePaise: data.deliveryFeePaise,
        taxPaise: data.taxPaise,
        totalPaise: data.totalPaise,
        estimatedDeliveryAt: data.estimatedDeliveryAt,
        placedAt: new Date(),
        updatedAt: new Date(),
        items: [],
        timeline: [],
      }),
    );

    findAvailableByIds = jest.fn();

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: { order: { create: createSpy } } },
        { provide: MenuService, useValue: { findAvailableByIds } },
        { provide: OrderEventsService, useValue: { publishOrderPlaced: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  it('prices the order from the database, not from the request', async () => {
    findAvailableByIds.mockResolvedValue(new Map([[BUTTER_CHICKEN_ID, BUTTER_CHICKEN]]));

    await service.create(baseDto([{ menuItemId: BUTTER_CHICKEN_ID, quantity: 2 }]));

    const { data } = createSpy.mock.calls[0][0];

    // 2 x ₹320 = ₹640 subtotal, which clears the ₹500 free-delivery threshold,
    // plus 5% tax = ₹32.
    expect(data.subtotalPaise).toBe(rupeesToPaise(640));
    expect(data.deliveryFeePaise).toBe(0);
    expect(data.taxPaise).toBe(rupeesToPaise(32));
    expect(data.totalPaise).toBe(rupeesToPaise(672));
  });

  it('charges delivery below the free-delivery threshold', async () => {
    findAvailableByIds.mockResolvedValue(new Map([[SAMOSA_ID, SAMOSA]]));

    await service.create(baseDto([{ menuItemId: SAMOSA_ID, quantity: 2 }]));

    const { data } = createSpy.mock.calls[0][0];

    expect(data.subtotalPaise).toBe(rupeesToPaise(80));
    expect(data.deliveryFeePaise).toBe(rupeesToPaise(40));
    expect(data.taxPaise).toBe(rupeesToPaise(4));
    expect(data.totalPaise).toBe(rupeesToPaise(124));
  });

  it('snapshots the name and unit price onto each line', async () => {
    findAvailableByIds.mockResolvedValue(new Map([[BUTTER_CHICKEN_ID, BUTTER_CHICKEN]]));

    await service.create(baseDto([{ menuItemId: BUTTER_CHICKEN_ID, quantity: 3 }]));

    const { data } = createSpy.mock.calls[0][0];

    expect(data.items.create).toEqual([
      {
        menuItemId: BUTTER_CHICKEN_ID,
        name: 'Butter Chicken',
        imageUrl: '/images/butter-chicken.jpg',
        unitPricePaise: rupeesToPaise(320),
        quantity: 3,
        lineTotalPaise: rupeesToPaise(960),
      },
    ]);
  });

  it('estimates delivery from the slowest dish, not the sum of all of them', async () => {
    findAvailableByIds.mockResolvedValue(
      new Map([
        [BUTTER_CHICKEN_ID, BUTTER_CHICKEN],
        [SAMOSA_ID, SAMOSA],
      ]),
    );

    const before = Date.now();
    await service.create(
      baseDto([
        { menuItemId: BUTTER_CHICKEN_ID, quantity: 1 },
        { menuItemId: SAMOSA_ID, quantity: 1 },
      ]),
    );

    const { data } = createSpy.mock.calls[0][0];
    const minutesOut = ((data.estimatedDeliveryAt as Date).getTime() - before) / 60_000;

    // 25 minutes prep (the slower dish) + 18 minutes travel, not 25 + 12 + 18.
    expect(minutesOut).toBeGreaterThan(42);
    expect(minutesOut).toBeLessThan(44);
  });

  it('opens an audit trail with a RECEIVED event', async () => {
    findAvailableByIds.mockResolvedValue(new Map([[SAMOSA_ID, SAMOSA]]));

    await service.create(baseDto([{ menuItemId: SAMOSA_ID, quantity: 1 }]));

    const { data } = createSpy.mock.calls[0][0];
    expect(data.timeline.create).toMatchObject({ status: 'RECEIVED' });
  });

  it('rejects a cart that lists the same dish twice', async () => {
    findAvailableByIds.mockResolvedValue(new Map([[SAMOSA_ID, SAMOSA]]));

    await expect(
      service.create(
        baseDto([
          { menuItemId: SAMOSA_ID, quantity: 1 },
          { menuItemId: SAMOSA_ID, quantity: 2 },
        ]),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('refuses to persist an order containing an unavailable dish', async () => {
    // Only one of the two requested dishes comes back as available.
    findAvailableByIds.mockResolvedValue(new Map([[SAMOSA_ID, SAMOSA]]));

    await expect(
      service.create(
        baseDto([
          { menuItemId: SAMOSA_ID, quantity: 1 },
          { menuItemId: BUTTER_CHICKEN_ID, quantity: 1 },
        ]),
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('files the order against the signed-in user when there is one', async () => {
    findAvailableByIds.mockResolvedValue(new Map([[SAMOSA_ID, SAMOSA]]));

    await service.create(baseDto([{ menuItemId: SAMOSA_ID, quantity: 1 }]), {
      id: 'user-9',
      email: 'demo@foodjet.dev',
      role: 'CUSTOMER',
    });

    expect(createSpy.mock.calls[0][0].data.userId).toBe('user-9');
  });

  it('leaves the order unattached for a guest checkout', async () => {
    findAvailableByIds.mockResolvedValue(new Map([[SAMOSA_ID, SAMOSA]]));

    await service.create(baseDto([{ menuItemId: SAMOSA_ID, quantity: 1 }]));

    expect(createSpy.mock.calls[0][0].data.userId).toBeNull();
  });
});
