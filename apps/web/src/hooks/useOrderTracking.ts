import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SOCKET_EVENTS,
  isTerminalStatus,
  type Order,
  type OrderStatusEvent,
} from '@foodjet/shared';
import { api } from '../lib/api-client';
import { ApiError } from '../lib/api-error';
import { createOrdersSocket, type OrdersSocket } from '../lib/socket';

export type ConnectionState = 'connecting' | 'live' | 'polling';

interface OrderTracking {
  order: Order | null;
  isLoading: boolean;
  error: string | null;
  connection: ConnectionState;
  refresh: () => Promise<void>;
}

/** Fallback poll interval used only when the socket cannot connect. */
const POLL_INTERVAL_MS = 5000;

function mergeTimelineEvent(order: Order, event: OrderStatusEvent): OrderStatusEvent[] {
  // A snapshot and a live event can describe the same transition, so match on
  // the status rather than appending blindly and rendering the step twice.
  const seen = order.timeline.some(
    (entry) => entry.status === event.status && entry.occurredAt === event.occurredAt,
  );

  return seen ? order.timeline : [...order.timeline, event];
}

/**
 * Live order state, pushed from the server.
 *
 * The REST fetch runs first so the page has content even where WebSockets are
 * blocked, then the socket takes over. If the socket never connects the hook
 * degrades to polling rather than showing a frozen status — the progression is
 * the server's, either way, so every viewer of an order agrees on it.
 */
export function useOrderTracking(orderId: string | undefined): OrderTracking {
  const [order, setOrder] = useState<Order | null>(null);
  // Derived up front rather than corrected inside an effect: with no id there is
  // nothing to load, so the hook starts in its final state instead of flashing a
  // spinner and then re-rendering into an error.
  const [isLoading, setIsLoading] = useState(() => Boolean(orderId));
  const [error, setError] = useState<string | null>(
    orderId ? null : 'No order specified',
  );
  const [connection, setConnection] = useState<ConnectionState>('connecting');

  const socketRef = useRef<OrdersSocket | null>(null);

  const refresh = useCallback(async () => {
    if (!orderId) return;

    try {
      const fetched = await api.getOrder(orderId);
      setOrder(fetched);
      setError(null);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return;
      setError(caught instanceof ApiError ? caught.message : 'Could not load this order');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    const controller = new AbortController();

    void (async () => {
      try {
        const fetched = await api.getOrder(orderId, controller.signal);
        if (!cancelled) {
          setOrder(fetched);
          setError(null);
        }
      } catch (caught) {
        if (cancelled || (caught instanceof DOMException && caught.name === 'AbortError')) {
          return;
        }
        setError(
          caught instanceof ApiError ? caught.message : 'Could not load this order',
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    const socket = createOrdersSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      if (cancelled) return;
      setConnection('live');
      socket.emit(SOCKET_EVENTS.subscribe, { orderId });
    });

    socket.on(SOCKET_EVENTS.snapshot, ({ order: snapshot }) => {
      if (cancelled) return;
      setOrder(snapshot);
      setError(null);
      setIsLoading(false);
    });

    socket.on(SOCKET_EVENTS.statusChanged, (payload) => {
      if (cancelled || payload.orderId !== orderId) return;

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: payload.status,
              estimatedDeliveryAt: payload.estimatedDeliveryAt,
              timeline: mergeTimelineEvent(prev, payload.event),
            }
          : prev,
      );
    });

    socket.on('disconnect', () => {
      if (!cancelled) setConnection('polling');
    });

    socket.on('connect_error', () => {
      if (!cancelled) setConnection('polling');
    });

    return () => {
      cancelled = true;
      controller.abort();
      socket.emit(SOCKET_EVENTS.unsubscribe, { orderId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId]);

  // Only polls while the socket is down and the order can still change.
  useEffect(() => {
    if (connection === 'live' || !orderId) return;
    if (order && isTerminalStatus(order.status)) return;

    const timer = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [connection, orderId, order, refresh]);

  return { order, isLoading, error, connection, refresh };
}
