import { amountToFreeDelivery, type PriceBreakdown } from '@foodjet/shared';
import { formatPaise } from '../lib/format';

interface PriceSummaryProps {
  pricing: PriceBreakdown;
  itemCount: number;
}

export function PriceSummary({ pricing, itemCount }: PriceSummaryProps) {
  const shortfall = amountToFreeDelivery(pricing.subtotalPaise);

  return (
    <>
      <div className="cart-summary-row">
        <span className="label">
          Subtotal ({itemCount} item{itemCount === 1 ? '' : 's'})
        </span>
        <span>{formatPaise(pricing.subtotalPaise)}</span>
      </div>

      <div className="cart-summary-row">
        <span className="label">Delivery fee</span>
        <span className={pricing.deliveryFeePaise === 0 ? 'is-free' : undefined}>
          {pricing.deliveryFeePaise === 0 ? 'FREE' : formatPaise(pricing.deliveryFeePaise)}
        </span>
      </div>

      <div className="cart-summary-row">
        <span className="label">Taxes (5%)</span>
        <span>{formatPaise(pricing.taxPaise)}</span>
      </div>

      {shortfall > 0 ? (
        <p className="cart-summary-hint">
          Add {formatPaise(shortfall)} more for free delivery
        </p>
      ) : (
        pricing.subtotalPaise > 0 && (
          <p className="cart-summary-hint is-free">🎉 Free delivery unlocked</p>
        )
      )}

      <div className="cart-summary-row total">
        <span className="label">Total</span>
        <span className="value">{formatPaise(pricing.totalPaise)}</span>
      </div>
    </>
  );
}
