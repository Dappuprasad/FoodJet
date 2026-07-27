import { useEffect, useState } from 'react';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  type MenuItem,
  type Order,
  type OrderStatus,
} from '@foodjet/shared';
import { Spinner } from '../components/Spinner';
import { useToast } from '../context/toast-context';
import { api } from '../lib/api-client';
import { ApiError } from '../lib/api-error';
import { formatDateTime, formatPaise } from '../lib/format';

type Tab = 'orders' | 'menu';

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('orders');

  return (
    <div className="page page-top fade-in">
      <div className="page-header">
        <h1 className="page-title">⚙️ Operations</h1>
        <p className="page-subtitle">Move orders along and manage the catalogue.</p>
      </div>

      <div className="admin-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'orders'}
          className={`admin-tab ${tab === 'orders' ? 'active' : ''}`}
          onClick={() => setTab('orders')}
        >
          Live orders
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'menu'}
          className={`admin-tab ${tab === 'menu' ? 'active' : ''}`}
          onClick={() => setTab('menu')}
        >
          Menu
        </button>
      </div>

      {tab === 'orders' ? <AdminOrders /> : <AdminMenu />}
    </div>
  );
}

function AdminOrders() {
  const { notify } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const page = await api.getAllOrders(1, 50);
        if (!cancelled) setOrders(page.data);
      } catch (caught) {
        if (!cancelled) {
          notify(
            caught instanceof ApiError ? caught.message : 'Could not load orders',
            'error',
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [notify]);

  const advance = async (order: Order, status: OrderStatus) => {
    setBusyId(order.id);

    try {
      const updated = await api.updateOrderStatus(order.id, { status });
      setOrders((prev) => prev.map((item) => (item.id === order.id ? updated : item)));
      notify(`${order.reference} → ${ORDER_STATUS_LABELS[status]}`);
    } catch (caught) {
      notify(
        caught instanceof ApiError ? caught.message : 'Could not update that order',
        'error',
      );
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <Spinner label="Loading orders..." />;

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <h3>No orders yet</h3>
      </div>
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Customer</th>
            <th>Placed</th>
            <th>Total</th>
            <th>Status</th>
            <th>Move to</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            // The state machine decides which buttons exist, so the UI can never
            // offer a transition the API would reject.
            const nextStates = ORDER_STATUS_TRANSITIONS[order.status];

            return (
              <tr key={order.id}>
                <td>
                  <code>{order.reference}</code>
                </td>
                <td>
                  {order.customerName}
                  <span className="admin-muted">{order.phone}</span>
                </td>
                <td>{formatDateTime(order.placedAt)}</td>
                <td>{formatPaise(order.totalPaise)}</td>
                <td>
                  <span className={`status-chip status-${order.status.toLowerCase()}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td>
                  <div className="admin-actions">
                    {nextStates.length === 0 ? (
                      <span className="admin-muted">—</span>
                    ) : (
                      nextStates.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className="admin-action"
                          disabled={busyId === order.id}
                          onClick={() => advance(order, status)}
                        >
                          {ORDER_STATUS_LABELS[status]}
                        </button>
                      ))
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AdminMenu() {
  const { notify } = useToast();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await api.getAdminMenu();
        if (!cancelled) setItems(response.items);
      } catch (caught) {
        if (!cancelled) {
          notify(
            caught instanceof ApiError ? caught.message : 'Could not load the menu',
            'error',
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [notify]);

  const toggleAvailability = async (item: MenuItem) => {
    setBusyId(item.id);

    try {
      const updated = item.isAvailable
        ? await api.delistMenuItem(item.id)
        : await api.updateMenuItem(item.id, { isAvailable: true });

      setItems((prev) => prev.map((entry) => (entry.id === item.id ? updated : entry)));
      notify(`${item.name} is now ${updated.isAvailable ? 'available' : 'delisted'}`);
    } catch (caught) {
      notify(
        caught instanceof ApiError ? caught.message : 'Could not update that dish',
        'error',
      );
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <Spinner label="Loading the menu..." />;

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Dish</th>
            <th>Category</th>
            <th>Price</th>
            <th>Prep</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={item.isAvailable ? '' : 'is-delisted'}>
              <td>
                {item.name}
                <span className="admin-muted">{item.slug}</span>
              </td>
              <td>{item.category}</td>
              <td>{formatPaise(item.pricePaise)}</td>
              <td>{item.preparationMinutes} min</td>
              <td>
                <span
                  className={`status-chip ${item.isAvailable ? 'status-delivered' : 'status-cancelled'}`}
                >
                  {item.isAvailable ? 'Available' : 'Delisted'}
                </span>
              </td>
              <td>
                <button
                  type="button"
                  className="admin-action"
                  disabled={busyId === item.id}
                  onClick={() => toggleAvailability(item)}
                >
                  {item.isAvailable ? 'Delist' : 'Relist'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
