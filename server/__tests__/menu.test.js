import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('Menu API', () => {
    it('GET /api/menu should return 200 with array of menu items', async () => {
        const res = await request(app).get('/api/menu');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(10);
    });

    it('each menu item should have required fields', async () => {
        const res = await request(app).get('/api/menu');
        res.body.forEach(item => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('description');
            expect(item).toHaveProperty('price');
            expect(item).toHaveProperty('image');
            expect(item).toHaveProperty('category');
            expect(typeof item.name).toBe('string');
            expect(typeof item.price).toBe('number');
            expect(item.price).toBeGreaterThan(0);
        });
    });

    it('menu should contain popular Indian dishes', async () => {
        const res = await request(app).get('/api/menu');
        const names = res.body.map(item => item.name);
        expect(names).toContain('Butter Chicken');
        expect(names).toContain('Biryani');
        expect(names).toContain('Masala Dosa');
        expect(names).toContain('Samosa');
    });
});
