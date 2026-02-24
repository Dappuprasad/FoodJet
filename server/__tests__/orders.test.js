import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { clearOrders, STATUS_FLOW } from '../data/store.js';

describe('Orders API', () => {
    beforeEach(() => {
        clearOrders();
    });

    const validOrder = {
        name: 'Rahul Sharma',
        address: '123 MG Road, Bangalore',
        phone: '9876543210',
        items: [
            { id: 1, name: 'Butter Chicken', quantity: 2, price: 320 },
            { id: 10, name: 'Samosa', quantity: 4, price: 40 },
        ],
    };

    describe('POST /api/orders', () => {
        it('should create an order with valid data', async () => {
            const res = await request(app)
                .post('/api/orders')
                .send(validOrder);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('status', 'Order Received');
            expect(res.body).toHaveProperty('statusIndex', 0);
            expect(res.body.customer.name).toBe('Rahul Sharma');
            expect(res.body.customer.address).toBe('123 MG Road, Bangalore');
            expect(res.body.customer.phone).toBe('9876543210');
            expect(res.body.items).toHaveLength(2);
            expect(res.body).toHaveProperty('totalAmount');
            expect(res.body.totalAmount).toBe(320 * 2 + 40 * 4);
        });

        it('should return 400 when name is missing', async () => {
            const res = await request(app)
                .post('/api/orders')
                .send({ ...validOrder, name: '' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('Name is required');
        });

        it('should return 400 when address is missing', async () => {
            const res = await request(app)
                .post('/api/orders')
                .send({ ...validOrder, address: '' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('Address is required');
        });

        it('should return 400 when phone is invalid', async () => {
            const res = await request(app)
                .post('/api/orders')
                .send({ ...validOrder, phone: '12345' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('Phone number must be 10 digits');
        });

        it('should return 400 when phone is missing', async () => {
            const res = await request(app)
                .post('/api/orders')
                .send({ ...validOrder, phone: '' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('Phone number is required');
        });

        it('should return 400 when items array is empty', async () => {
            const res = await request(app)
                .post('/api/orders')
                .send({ ...validOrder, items: [] });

            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('At least one item is required');
        });

        it('should return 400 when items is missing', async () => {
            const { items, ...noItems } = validOrder;
            const res = await request(app)
                .post('/api/orders')
                .send(noItems);

            expect(res.status).toBe(400);
        });

        it('should trim whitespace from customer fields', async () => {
            const res = await request(app)
                .post('/api/orders')
                .send({ ...validOrder, name: '  Rahul  ', address: '  MG Road  ' });

            expect(res.status).toBe(201);
            expect(res.body.customer.name).toBe('Rahul');
            expect(res.body.customer.address).toBe('MG Road');
        });
    });

    describe('GET /api/orders/:id', () => {
        it('should return order by ID', async () => {
            const createRes = await request(app)
                .post('/api/orders')
                .send(validOrder);

            const orderId = createRes.body.id;
            const res = await request(app).get(`/api/orders/${orderId}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(orderId);
            expect(res.body.status).toBe('Order Received');
        });

        it('should return 404 for non-existent order', async () => {
            const res = await request(app).get('/api/orders/non-existent-id');
            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Order not found');
        });
    });

    describe('PATCH /api/orders/:id/status', () => {
        it('should update order status', async () => {
            const createRes = await request(app)
                .post('/api/orders')
                .send(validOrder);

            const orderId = createRes.body.id;
            const res = await request(app)
                .patch(`/api/orders/${orderId}/status`)
                .send({ status: 'Preparing' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('Preparing');
            expect(res.body.statusIndex).toBe(1);
        });

        it('should return 400 for invalid status', async () => {
            const createRes = await request(app)
                .post('/api/orders')
                .send(validOrder);

            const orderId = createRes.body.id;
            const res = await request(app)
                .patch(`/api/orders/${orderId}/status`)
                .send({ status: 'InvalidStatus' });

            expect(res.status).toBe(400);
            expect(res.body.validStatuses).toEqual(STATUS_FLOW);
        });

        it('should return 404 for non-existent order', async () => {
            const res = await request(app)
                .patch('/api/orders/non-existent-id/status')
                .send({ status: 'Preparing' });

            expect(res.status).toBe(404);
        });

        it('should allow updating through all valid statuses', async () => {
            const createRes = await request(app)
                .post('/api/orders')
                .send(validOrder);

            const orderId = createRes.body.id;

            for (let i = 1; i < STATUS_FLOW.length; i++) {
                const res = await request(app)
                    .patch(`/api/orders/${orderId}/status`)
                    .send({ status: STATUS_FLOW[i] });

                expect(res.status).toBe(200);
                expect(res.body.status).toBe(STATUS_FLOW[i]);
                expect(res.body.statusIndex).toBe(i);
            }
        });
    });

    describe('Health Check', () => {
        it('GET /api/health should return ok', async () => {
            const res = await request(app).get('/api/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
        });
    });
});
