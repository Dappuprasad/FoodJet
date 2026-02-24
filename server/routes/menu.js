import express from 'express';
import { getMenu } from '../data/store.js';

const router = express.Router();

// GET /api/menu - Return all menu items
router.get('/', (req, res) => {
    const menu = getMenu();
    res.json(menu);
});

export default router;
