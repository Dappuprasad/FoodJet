export const ORDER_STATUSES = [
  'RECEIVED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** The happy path, in order. CANCELLED is deliberately not part of it. */
export const ORDER_STATUS_FLOW = [
  'RECEIVED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
] as const satisfies readonly OrderStatus[];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  RECEIVED: 'Order Received',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = ['DELIVERED', 'CANCELLED'];

/**
 * Legal transitions. Anything not listed here is rejected by the API, so an
 * order can't jump from RECEIVED straight to DELIVERED or crawl back out of a
 * terminal state — including via the admin endpoints.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  RECEIVED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return TERMINAL_ORDER_STATUSES.includes(status);
}

/** Position on the happy path, used to drive the tracking stepper. -1 if cancelled. */
export function orderStatusStep(status: OrderStatus): number {
  return (ORDER_STATUS_FLOW as readonly OrderStatus[]).indexOf(status);
}

/** The next status on the happy path, or null if there isn't one. */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  const step = orderStatusStep(status);
  if (step === -1) return null;
  return ORDER_STATUS_FLOW[step + 1] ?? null;
}
