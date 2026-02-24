import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import OrderStatus from '../components/OrderStatus';

const API_URL = '/api';

function OrderTrackingPage() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let interval;

        const fetchOrder = async () => {
            try {
                const res = await fetch(`${API_URL}/orders/${id}`);
                if (!res.ok) throw new Error('Order not found');
                const data = await res.json();
                setOrder(data);
                setLoading(false);

                if (data.status === 'Delivered') {
                    clearInterval(interval);
                }
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchOrder();
        interval = setInterval(fetchOrder, 3000);
        return () => clearInterval(interval);
    }, [id]);

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
                    {order.status === 'Delivered' && (
                        <div className="success-animation">
                            <div className="success-checkmark">✓</div>
                        </div>
                    )}

                    <div className="tracking-order-id">Order #{id.slice(0, 8)}</div>
                    <h2 className="tracking-title">
                        {order.status === 'Delivered' ? '🎉 Order Delivered!' : '🔥 Tracking Your Order'}
                    </h2>

                    <OrderStatus currentStatus={order.status} statusIndex={order.statusIndex} />

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
