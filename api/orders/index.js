import { createOrder } from '../../server/data/store.js';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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

    const order = createOrder({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        items,
    });

    res.status(201).json(order);
}
