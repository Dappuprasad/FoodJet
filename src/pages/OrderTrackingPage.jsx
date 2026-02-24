import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import OrderStatus from '../components/OrderStatus';

const API_URL = '/api';

const STATUS_FLOW = ['Order Received', 'Preparing', 'Out for Delivery', 'Delivered'];

function OrderTrackingPage() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusIndex, setStatusIndex] = useState(0);

    // Fetch the order once
    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`${API_URL}/orders/${id}`);
                if (!res.ok) throw new Error('Order not found');
                const data = await res.json();
                setOrder(data);
                setStatusIndex(data.statusIndex || 0);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id]);

    // Simulate status progression on the client side for reliable demo
    useEffect(() => {
        if (!order || statusIndex >= STATUS_FLOW.length - 1) return;

        const delay = 5000 + Math.random() * 5000; // 5-10 seconds per step
        const timer = setTimeout(() => {
            setStatusIndex(prev => {
                const next = prev + 1;
                setOrder(o => ({
                    ...o,
                    status: STATUS_FLOW[next],
                    statusIndex: next,
                }));
                return next;
            });
        }, delay);

        return () => clearTimeout(timer);
    }, [order, statusIndex]);

    if (loading) {
        return (
            <div className="page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page" style={{ paddingTop: '2rem' }}>
                <div className="empty-state fade-in">
                    <div className="empty-icon">❌</div>
                    <h3>Order not found</h3>
                    <p>We couldn't find an order with that ID</p>
                    <Link to="/" className="browse-menu-btn">🍽️ Back to Menu</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page fade-in" style={{ paddingTop: '2rem' }}>
            <div className="tracking-container">
                <div className="tracking-card">
                    {statusIndex >= STATUS_FLOW.length - 1 && (
                        <div className="success-animation">
                            <div className="success-checkmark">✓</div>
                        </div>
                    )}

                    <div className="tracking-order-id">Order #{id.slice(0, 8)}</div>
                    <h2 className="tracking-title">
                        {statusIndex >= STATUS_FLOW.length - 1 ? '🎉 Order Delivered!' : '🔥 Tracking Your Order'}
                    </h2>

                    <OrderStatus currentStatus={STATUS_FLOW[statusIndex]} statusIndex={statusIndex} />

                    <div className="tracking-details">
                        <h4>📋 Order Details</h4>
                        <div className="tracking-detail-row">
                            <span className="label">Customer</span>
                            <span>{order.customer.name}</span>
                        </div>
                        <div className="tracking-detail-row">
                            <span className="label">Address</span>
                            <span>{order.customer.address}</span>
                        </div>
                        <div className="tracking-detail-row">
                            <span className="label">Phone</span>
                            <span>{order.customer.phone}</span>
                        </div>
                        <div className="tracking-detail-row">
                            <span className="label">Total Amount</span>
                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{order.totalAmount}</span>
                        </div>

                        <div className="tracking-item-list">
                            <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>🛍️ Items Ordered</h4>
                            {order.items.map((item, idx) => (
                                <div key={idx} className="tracking-item">
                                    <span>{item.name} × {item.quantity}</span>
                                    <span>₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Link to="/" className="back-to-menu-btn">
                        🍛 Order More Food
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default OrderTrackingPage;
