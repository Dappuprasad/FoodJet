import { describe, expect, it } from 'vitest';
import {
  DELIVERY_FEE_PAISE,
  FREE_DELIVERY_THRESHOLD_PAISE,
  amountToFreeDelivery,
  calculatePricing,
} from './pricing.js';
import { formatPaise, rupeesToPaise } from './money.js';

describe('calculatePricing', () => {
  it('returns zeroes for an empty cart, and charges no delivery on nothing', () => {
    expect(calculatePricing([])).toEqual({
      subtotalPaise: 0,
      deliveryFeePaise: 0,
      taxPaise: 0,
      totalPaise: 0,
    });
  });

  it('multiplies unit price by quantity across lines', () => {
    const pricing = calculatePricing([
      { unitPricePaise: rupeesToPaise(320), quantity: 2 },
      { unitPricePaise: rupeesToPaise(40), quantity: 3 },
    ]);

    expect(pricing.subtotalPaise).toBe(rupeesToPaise(760));
  });

  it('charges the flat fee below the free-delivery threshold', () => {
    const pricing = calculatePricing([
      { unitPricePaise: FREE_DELIVERY_THRESHOLD_PAISE - 1, quantity: 1 },
    ]);

    expect(pricing.deliveryFeePaise).toBe(DELIVERY_FEE_PAISE);
  });

  it('waives delivery exactly at the threshold, not just above it', () => {
    const pricing = calculatePricing([
      { unitPricePaise: FREE_DELIVERY_THRESHOLD_PAISE, quantity: 1 },
    ]);

    expect(pricing.deliveryFeePaise).toBe(0);
  });

  it('applies 5% tax to the subtotal only, never to the delivery fee', () => {
    const pricing = calculatePricing([{ unitPricePaise: rupeesToPaise(100), quantity: 1 }]);

    expect(pricing.taxPaise).toBe(rupeesToPaise(5));
    expect(pricing.totalPaise).toBe(
      pricing.subtotalPaise + pricing.deliveryFeePaise + pricing.taxPaise,
    );
  });

  it('rounds tax to whole paise rather than carrying a fraction', () => {
    // ₹1.23 -> 123 paise; 5% is 6.15 paise, which must land on an integer.
    const pricing = calculatePricing([{ unitPricePaise: 123, quantity: 1 }]);

    expect(Number.isInteger(pricing.taxPaise)).toBe(true);
    expect(pricing.taxPaise).toBe(6);
  });

  it('keeps every figure an integer for a cart that would break float maths', () => {
    const pricing = calculatePricing([
      { unitPricePaise: 10, quantity: 1 },
      { unitPricePaise: 20, quantity: 1 },
    ]);

    expect(Number.isInteger(pricing.subtotalPaise)).toBe(true);
    expect(Number.isInteger(pricing.totalPaise)).toBe(true);
    expect(pricing.subtotalPaise).toBe(30);
  });
});

describe('amountToFreeDelivery', () => {
  it('reports the shortfall below the threshold', () => {
    expect(amountToFreeDelivery(rupeesToPaise(320))).toBe(rupeesToPaise(180));
  });

  it('clamps to zero once the threshold is met or passed', () => {
    expect(amountToFreeDelivery(FREE_DELIVERY_THRESHOLD_PAISE)).toBe(0);
    expect(amountToFreeDelivery(rupeesToPaise(900))).toBe(0);
  });
});

describe('formatPaise', () => {
  it('renders whole rupees without decimals', () => {
    expect(formatPaise(rupeesToPaise(320))).toBe('₹320');
  });

  it('shows paise when the amount is not a whole rupee', () => {
    expect(formatPaise(32050)).toBe('₹320.50');
  });

  it('formats zero rather than an empty string', () => {
    expect(formatPaise(0)).toBe('₹0');
  });
});
