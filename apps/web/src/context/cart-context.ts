import { createContext, useContext } from 'react';
import type { MenuItem, PriceBreakdown } from '@foodjet/shared';

export interface CartLine {
  menuItemId: string;
  name: string;
  imageUrl: string;
  unitPricePaise: number;
  quantity: number;
}

export interface CartContextValue {
  lines: CartLine[];
  totalItems: number;
  pricing: PriceBreakdown;
  add: (item: MenuItem) => void;
  remove: (menuItemId: string) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  clear: () => void;
  quantityOf: (menuItemId: string) => number;
}

/**
 * The context object and its hook live apart from the provider component so
 * that the provider module exports components only — which is what keeps Fast
 * Refresh working instead of forcing a full reload on every edit.
 */
export const CartContext = createContext<CartContextValue | null>(null);

export const CART_STORAGE_KEY = 'foodjet.cart';
export const MAX_CART_QUANTITY = 50;

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
