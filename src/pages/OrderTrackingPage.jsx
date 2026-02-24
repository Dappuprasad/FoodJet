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
                if (!res.ok) {
                    setError('Order not found');
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                setOrder(data);
                setLoading(false);

                // Stop polling when delivered
                if (data.status === 'Delivered' && interval) {
                    clearInterval(interval);
                }
            } catch (err) {
                setError('Failed to load order');
                setLoading(false);
            }
        };

        fetchOrder();

        // Poll every 3 seconds for real-time updates
        interval = setInterval(fetchOrder, 3000);

        return () => clearInterval(interval);
    }, [id]);

    if (loading) {
        return (
            <div className="page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading your order...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page">
                <div className="empty-state">
                    <div className="empty-icon">😕</div>
                    <h3>{error}</h3>
                    <p>We couldn't find this order</p>
                    <Link to="/" className="browse-menu-btn">🍽️ Back to Menu</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="tracking-container fade-in">
                <div className="tracking-card">
                    {order.status === 'Order Received' && (
                        <div className="success-animation">
                            <div className="success-checkmark">✓</div>
                        </div>
                    )}

                    <div className="tracking-order-id">Order #{id.slice(0, 8).toUpperCase()}</div>
                    <h2 className="tracking-title">
                        {order.status === 'Delivered'
                            ? '🎉 Order Delivered!'
                            : order.status === 'Out for Delivery'
                                ? '🏍️ On its way!'
                                : order.status === 'Preparing'
                                    ? '👨‍🍳 Being prepared...'
                                    : '✅ Order Confirmed!'}
                    </h2>

                    <OrderStatus
                        currentStatus={order.status}
                        statusIndex={order.statusIndex}
                    />

                    <div className="tracking-details">
                        <h4>Order Details</h4>
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
                            <span className="label">Total</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{order.totalAmount}</span>
                        </div>

                        <div className="tracking-item-list">
                            <h4 style={{ marginTop: '1rem' }}>Items Ordered</h4>
                            {order.items.map((item, i) => (
                                <div key={i} className="tracking-item">
                                    <span>{item.name} × {item.quantity}</span>
                                    <span>₹{(item.price || 0) * item.quantity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Link to="/" className="back-to-menu-btn">
                        🍽️ Order More
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default OrderTrackingPage;
