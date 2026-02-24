import express from 'express';
import { createOrder, getOrder, updateOrderStatus, STATUS_FLOW } from '../data/store.js';

const router = express.Router();

// POST /api/orders - Create a new order
router.post('/', (req, res) => {
    const { name, address, phone, items } = req.body;

    // Validation
    const errors = [];
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Name is required');
    }
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
        errors.push('Address is required');
    }
    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
        errors.push('Phone number is required');
    } else if (!/^[0-9]{10}$/.test(phone.trim())) {
        errors.push('Phone number must be 10 digits');
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        errors.push('At least one item is required');
    }
    if (items && Array.isArray(items)) {
        items.forEach((item, index) => {
            if (!item.id || !item.quantity || item.quantity < 1) {
                errors.push(`Item at index ${index} is invalid`);
            }
        });
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const order = createOrder({ name: name.trim(), address: address.trim(), phone: phone.trim(), items });
    res.status(201).json(order);
});

// GET /api/orders/:id - Get order by ID
router.get('/:id', (req, res) => {
    const order = getOrder(req.params.id);
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
});

// PATCH /api/orders/:id/status - Update order status
router.patch('/:id/status', (req, res) => {
    const { status } = req.body;

    if (!status || !STATUS_FLOW.includes(status)) {
        return res.status(400).json({
            error: 'Invalid status',
            validStatuses: STATUS_FLOW,
        });
    }

    const order = updateOrderStatus(req.params.id, status);
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
});

export default router;
