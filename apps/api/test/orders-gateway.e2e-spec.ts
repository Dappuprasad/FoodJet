import { VersioningType, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { io, type Socket } from 'socket.io-client';
import { ORDERS_NAMESPACE, SOCKET_EVENTS, rupeesToPaise } from '@foodjet/shared';
import { AppModule } from '../src/app.module';
import { buildValidationPipe } from '../src/common/validation';
import { PrismaService } from '../src/prisma/prisma.service';

const CUSTOMER = { email: 'ws-customer@foodjet.test', password: 'Customer@12345' };

/**
 * Regression cover for the socket authorisation race.
 *
 * Authenticating in `handleConnection` looked correct but was not awaited by
 * Socket.IO, so a client that subscribed immediately on `connect` hit the
 * subscribe handler before the token had resolved and was refused access to its
 * own order. These tests subscribe as early as possible on purpose.
 */
describe('OrdersGateway (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let baseUrl: string;
  let dishId: string;
  let accessToken: string;

  const sockets: Socket[] = [];

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(buildValidationPipe());

    await app.init();
    await app.listen(0); // ephemeral port; the gateway needs a real HTTP server

    baseUrl = (await app.getUrl()).replace('[::1]', '127.0.0.1');

    prisma = app.get(PrismaService);
    await prisma.truncateAll();

    const dish = await prisma.menuItem.create({
      data: {
        slug: 'ws-samosa',
        name: 'Samosa',
        description: 'Crispy pastry filled with spiced potatoes and peas',
        pricePaise: rupeesToPaise(40),
        imageUrl: '/images/samosa.jpg',
        category: 'Street Food',
        preparationMinutes: 12,
      },
    });
    dishId = dish.id;

    const registered = await http()
      .post('/api/v1/auth/register')
      .send({ ...CUSTOMER, name: 'WS Customer' })
      .expect(201);

    accessToken = registered.body.accessToken;
  });

  afterAll(async () => {
    for (const socket of sockets) socket.disconnect();
    await prisma.truncateAll();
    await app.close();
  });

  function connect(token?: string): Socket {
    const socket = io(`${baseUrl}${ORDERS_NAMESPACE}`, {
      transports: ['websocket'],
      auth: token ? { token } : {},
      forceNew: true,
    });

    sockets.push(socket);
    return socket;
  }

  /** Subscribes the instant the socket connects — the shape that exposed the bug. */
  function subscribeOnConnect(socket: Socket, orderId: string) {
    return new Promise<{ ok: boolean; message?: string }>((resolve) => {
      const timer = setTimeout(() => resolve({ ok: false, message: 'timed out' }), 10_000);
      const done = (result: { ok: boolean; message?: string }) => {
        clearTimeout(timer);
        resolve(result);
      };

      socket.on('connect', () => socket.emit(SOCKET_EVENTS.subscribe, { orderId }));
      socket.on(SOCKET_EVENTS.snapshot, () => done({ ok: true }));
      socket.on(SOCKET_EVENTS.error, (e: { message: string }) =>
        done({ ok: false, message: e.message }),
      );
    });
  }

  /** Places an order and returns its id. `body` is `any` from supertest, so the
   *  cast is confined to this one place rather than repeated per test. */
  async function placeOrder(token?: string): Promise<string> {
    const req = http()
      .post('/api/v1/orders')
      .send({
        customerName: 'Rahul Sharma',
        phone: '9876543210',
        addressLine: '42, MG Road, Koramangala, Bangalore 560034',
        items: [{ menuItemId: dishId, quantity: 1 }],
      });

    if (token) req.set('Authorization', `Bearer ${token}`);

    const response = await req.expect(201);
    return (response.body as { id: string }).id;
  }

  it('lets a signed-in customer watch an order filed against their account', async () => {
    const orderId = await placeOrder(accessToken);

    const result = await subscribeOnConnect(connect(accessToken), orderId);

    expect(result).toEqual({ ok: true });
  });

  it('lets an anonymous client watch a guest order — the tracking link', async () => {
    const orderId = await placeOrder();

    const result = await subscribeOnConnect(connect(), orderId);

    expect(result).toEqual({ ok: true });
  });

  it('refuses an anonymous client an order that belongs to an account', async () => {
    const orderId = await placeOrder(accessToken);

    const result = await subscribeOnConnect(connect(), orderId);

    expect(result.ok).toBe(false);
    expect(result.message).toBe('Order not found');
  });

  it('connects anonymously rather than failing when the token is invalid', async () => {
    const orderId = await placeOrder();

    const result = await subscribeOnConnect(connect('not.a.valid.token'), orderId);

    expect(result).toEqual({ ok: true });
  });

  it('reports an unknown order rather than hanging', async () => {
    const result = await subscribeOnConnect(
      connect(accessToken),
      '99999999-9999-4999-8999-999999999999',
    );

    expect(result.ok).toBe(false);
    expect(result.message).toBe('Order not found');
  });
});
