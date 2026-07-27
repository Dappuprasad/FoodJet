import { rupeesToPaise } from './money.js';

/** Orders at or above this subtotal ship free. */
export const FREE_DELIVERY_THRESHOLD_PAISE = rupeesToPaise(500);

/** Flat delivery fee applied below the free-delivery threshold. */
export const DELIVERY_FEE_PAISE = rupeesToPaise(40);

/** GST applied to the subtotal, as basis points (500 = 5.00%). */
export const TAX_RATE_BPS = 500;

export interface PriceableLine {
  /** Unit price in paise, captured at the time of ordering. */
  unitPricePaise: number;
  quantity: number;
}

export interface PriceBreakdown {
  subtotalPaise: number;
  deliveryFeePaise: number;
  taxPaise: number;
  totalPaise: number;
}

/**
 * The single source of truth for order totals.
 *
 * The API calls this to compute the amount it will actually charge, and the web
 * client calls the same function to preview it. Sharing the implementation is
 * what stops the cart from quietly disagreeing with the invoice — but the client
 * result is only ever a preview: the server recomputes from its own menu prices
 * and never trusts a total that arrived over the wire.
 */
export function calculatePricing(lines: readonly PriceableLine[]): PriceBreakdown {
  const subtotalPaise = lines.reduce(
    (sum, line) => sum + line.unitPricePaise * line.quantity,
    0,
  );

  const deliveryFeePaise =
    subtotalPaise === 0 || subtotalPaise >= FREE_DELIVERY_THRESHOLD_PAISE
      ? 0
      : DELIVERY_FEE_PAISE;

  const taxPaise = Math.round((subtotalPaise * TAX_RATE_BPS) / 10_000);

  return {
    subtotalPaise,
    deliveryFeePaise,
    taxPaise,
    totalPaise: subtotalPaise + deliveryFeePaise + taxPaise,
  };
}

/** Paise still needed to unlock free delivery, or 0 if already unlocked. */
export function amountToFreeDelivery(subtotalPaise: number): number {
  return Math.max(0, FREE_DELIVERY_THRESHOLD_PAISE - subtotalPaise);
}
