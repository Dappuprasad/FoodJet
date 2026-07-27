import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ORDER_STATUS_LABELS, canTransition } from '@foodjet/shared';
import { OrderStatusStepper } from '../components/OrderStatusStepper';
import { Spinner } from '../components/Spinner';
import { useToast } from '../context/toast-context';
import { useOrderTracking } from '../hooks/useOrderTracking';
import { api } from '../lib/api-client';
import { ApiError } from '../lib/api-error';
import { formatDateTime, formatEta, formatPaise, formatTime } from '../lib/format';

export function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { order, isLoading, error, connection, refresh } = useOrderTracking(id);
  const { notify } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!order) return;

    setIsCancelling(true);
    try {
      await api.cancelOrder(order.id);
      await refresh();
      notify('Order cancelled', 'info');
    } catch (caught) {
      notify(
        caught instanceof ApiError ? caught.message : 'Could not cancel this order',
        'error',
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page">
        <Spinner label="Loading your order..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page page-top">
        <div className="empty-state fade-in">
          <div className="empty-icon">🔍</div>
          <h3>Order not found</h3>
          <p>{error ?? "We couldn't find an order with that reference."}</p>
          <Link to="/" className="browse-menu-btn">
            🍽️ Back to menu
          </Link>
        </div>
      </div>
    );
  }

  const isDelivered = order.status === 'DELIVERED';
  const isCancelled = order.status === 'CANCELLED';
  const canCancel = canTransition(order.status, 'CANCELLED');

  return (
    <div className="page page-top fade-in">
      <div className="tracking-container">
        <div className="tracking-card">
          {isDelivered && (
            <div className="success-animation">
              <div className="success-checkmark">✓</div>
            </div>
          )}

          <div className="tracking-header">
            <span className="tracking-order-id">Order {order.reference}</span>
            <span
              className={`tracking-connection ${connection}`}
              title={
                connection === 'live'
                  ? 'Receiving live updates'
                  : 'Live connection unavailable — refreshing periodically'
              }
            >
              <span className="connection-dot" aria-hidden="true" />
              {connection === 'live' ? 'Live' : 'Reconnecting'}
            </span>
          </div>

          <h1 className="tracking-title">
            {isDelivered
              ? '🎉 Delivered — enjoy!'
              : isCancelled
                ? 'Order cancelled'
                : '🔥 Tracking your order'}
          </h1>

          {!isDelivered && !isCancelled && (
            <p className="tracking-eta">
              Arriving {formatEta(order.estimatedDeliveryAt)} · around{' '}
              {formatTime(order.estimatedDeliveryAt)}
            </p>
          )}

          <OrderStatusStepper status={order.status} />

          <div className="tracking-details">
            <h2>📋 Order details</h2>

            <div className="tracking-detail-row">
              <span className="label">Placed</span>
              <span>{formatDateTime(order.placedAt)}</span>
            </div>
            <div className="tracking-detail-row">
              <span className="label">Customer</span>
              <span>{order.customerName}</span>
            </div>
            <div className="tracking-detail-row">
              <span className="label">Address</span>
              <span>{order.addressLine}</span>
            </div>
            <div className="tracking-detail-row">
              <span className="label">Phone</span>
              <span>{order.phone}</span>
            </div>
            {order.deliveryNotes && (
              <div className="tracking-detail-row">
                <span className="label">Notes</span>
                <span>{order.deliveryNotes}</span>
              </div>
            )}

            <h2 className="tracking-subhead">🛍️ Items</h2>
            <div className="tracking-item-list">
              {order.items.map((item) => (
                <div key={item.id} className="tracking-item">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatPaise(item.lineTotalPaise)}</span>
                </div>
              ))}
            </div>

            <div className="tracking-item tracking-total">
              <span>Total paid</span>
              <span>{formatPaise(order.totalPaise)}</span>
            </div>

            <h2 className="tracking-subhead">🕒 Timeline</h2>
            <ol className="tracking-timeline">
              {order.timeline.map((event, index) => (
                <li key={`${event.status}-${index}`}>
                  <span className="timeline-time">{formatTime(event.occurredAt)}</span>
                  <span className="timeline-status">
                    {ORDER_STATUS_LABELS[event.status]}
                  </span>
                  {event.note && <span className="timeline-note">{event.note}</span>}
                </li>
              ))}
            </ol>
          </div>

          <div className="tracking-actions">
            <Link to="/" className="back-to-menu-btn">
              🍛 Order more food
            </Link>

            {canCancel && (
              <button
                type="button"
                className="cancel-order-btn"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Cancel order'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
