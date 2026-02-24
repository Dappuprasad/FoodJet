import { getMenu } from '../server/data/store.js';

export default function handler(req, res) {
    if (req.method === 'GET') {
        return res.status(200).json(getMenu());
    }
    res.status(405).json({ error: 'Method not allowed' });
}
