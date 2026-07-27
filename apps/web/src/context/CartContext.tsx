import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { calculatePricing, type MenuItem } from '@foodjet/shared';
import {
  CART_STORAGE_KEY,
  CartContext,
  MAX_CART_QUANTITY,
  type CartContextValue,
  type CartLine,
} from './cart-context';

function readStoredCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Validate rather than trust: the shape in localStorage was written by a
    // previous version of this app and may not match what the code expects now.
    return parsed.filter(isCartLine);
  } catch {
    return [];
  }
}

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== 'object' || value === null) return false;
  const line = value as Record<string, unknown>;

  return (
    typeof line.menuItemId === 'string' &&
    typeof line.name === 'string' &&
    typeof line.imageUrl === 'string' &&
    typeof line.unitPricePaise === 'number' &&
    typeof line.quantity === 'number' &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readStoredCart);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage full or unavailable — the cart still works for this session */
    }
  }, [lines]);

  const add = useCallback((item: MenuItem) => {
    setLines((prev) => {
      const existing = prev.find((line) => line.menuItemId === item.id);

      if (existing) {
        if (existing.quantity >= MAX_CART_QUANTITY) return prev;
        return prev.map((line) =>
          line.menuItemId === item.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }

      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
          // Cached for display only. The server reprices from its own menu at
          // checkout, so a stale price here can never become a stale charge.
          unitPricePaise: item.pricePaise,
          quantity: 1,
        },
      ];
    });
  }, []);

  const remove = useCallback((menuItemId: string) => {
    setLines((prev) => prev.filter((line) => line.menuItemId !== menuItemId));
  }, []);

  const setQuantity = useCallback((menuItemId: string, quantity: number) => {
    setLines((prev) => {
      if (quantity < 1) return prev.filter((line) => line.menuItemId !== menuItemId);

      return prev.map((line) =>
        line.menuItemId === menuItemId
          ? { ...line, quantity: Math.min(quantity, MAX_CART_QUANTITY) }
          : line,
      );
    });
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const quantityOf = (menuItemId: string) =>
      lines.find((line) => line.menuItemId === menuItemId)?.quantity ?? 0;

    return {
      lines,
      totalItems: lines.reduce((sum, line) => sum + line.quantity, 0),
      pricing: calculatePricing(lines),
      add,
      remove,
      setQuantity,
      clear,
      quantityOf,
    };
  }, [lines, add, remove, setQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
