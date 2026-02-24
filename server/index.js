import express from 'express';
import cors from 'cors';
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server only when not in test mode
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`🚀 FoodJet API server running on http://localhost:${PORT}`);
    });
}

export default app;
