import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ORDER_STATUS_LABELS, type Order } from '@foodjet/shared';
import { Spinner } from '../components/Spinner';
import { api } from '../lib/api-client';
import { ApiError } from '../lib/api-error';
import { formatDateTime, formatPaise } from '../lib/format';

export function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const page = await api.getMyOrders();
        if (!cancelled) setOrders(page.data);
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError ? caught.message : 'Could not load your orders',
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="page">
        <Spinner label="Loading your orders..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page page-top">
        <div className="empty-state fade-in">
          <div className="empty-icon">📡</div>
          <h3>Could not load orders</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="page page-top">
        <div className="empty-state fade-in">
          <div className="empty-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Your past orders will show up here.</p>
          <Link to="/" className="browse-menu-btn">
            🍽️ Browse menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-top fade-in">
      <div className="page-header">
        <h1 className="page-title">📦 Your orders</h1>
        <p className="page-subtitle">
          {orders.length} order{orders.length === 1 ? '' : 's'} so far
        </p>
      </div>

      <div className="history-list">
        {orders.map((order) => (
          <Link key={order.id} to={`/track/${order.id}`} className="history-card">
            <div className="history-card-head">
              <span className="history-reference">{order.reference}</span>
              <span className={`status-chip status-${order.status.toLowerCase()}`}>
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>

            <p className="history-items">
              {order.items.map((item) => `${item.name} × ${item.quantity}`).join(', ')}
            </p>

            <div className="history-card-foot">
              <span>{formatDateTime(order.placedAt)}</span>
              <strong>{formatPaise(order.totalPaise)}</strong>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
