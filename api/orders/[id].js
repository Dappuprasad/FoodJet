import { getOrder, updateOrderStatus, STATUS_FLOW } from '../../server/data/store.js';

export default function handler(req, res) {
    const { id } = req.query;

    if (req.method === 'GET') {
        const order = getOrder(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        return res.status(200).json(order);
    }

    if (req.method === 'PATCH') {
        const { status } = req.body;

        if (!status || !STATUS_FLOW.includes(status)) {
            return res.status(400).json({
                error: 'Invalid status',
                validStatuses: STATUS_FLOW,
            });
        }

        const order = updateOrderStatus(id, status);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        return res.status(200).json(order);
    }

    res.status(405).json({ error: 'Method not allowed' });
}
