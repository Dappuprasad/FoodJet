import type { OrderStatus } from './order-status.js';

/* ---------------------------------------------------------------- users --- */

export const USER_ROLES = ['CUSTOMER', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  /** Seconds until `accessToken` expires. */
  expiresIn: number;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/* ----------------------------------------------------------------- menu --- */

export interface MenuItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  pricePaise: number;
  imageUrl: string;
  category: string;
  isVegetarian: boolean;
  /** Chilli rating, 0-3. */
  spiceLevel: number;
  preparationMinutes: number;
  rating: number;
  ratingCount: number;
  isAvailable: boolean;
}

export interface MenuQuery {
  category?: string;
  search?: string;
  vegetarianOnly?: boolean;
  /** Admin-only: include items hidden from the storefront. */
  includeUnavailable?: boolean;
}

export interface MenuResponse {
  items: MenuItem[];
  categories: string[];
}

export interface UpsertMenuItemPayload {
  name: string;
  description: string;
  pricePaise: number;
  imageUrl: string;
  category: string;
  isVegetarian: boolean;
  spiceLevel: number;
  preparationMinutes: number;
  isAvailable?: boolean;
}

/* --------------------------------------------------------------- orders --- */

export interface OrderItem {
  id: string;
  menuItemId: string;
  /** Name and price are denormalised so a historic order survives a menu edit. */
  name: string;
  imageUrl: string;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  occurredAt: string;
  note: string | null;
}

export interface Order {
  id: string;
  /** Short human-quotable reference, e.g. "FJ-7QK4M2". */
  reference: string;
  status: OrderStatus;
  items: OrderItem[];
  customerName: string;
  phone: string;
  addressLine: string;
  deliveryNotes: string | null;
  subtotalPaise: number;
  deliveryFeePaise: number;
  taxPaise: number;
  totalPaise: number;
  /** ISO timestamp of the projected delivery time. */
  estimatedDeliveryAt: string;
  placedAt: string;
  updatedAt: string;
  timeline: OrderStatusEvent[];
}

export interface CreateOrderItemPayload {
  menuItemId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  customerName: string;
  phone: string;
  addressLine: string;
  deliveryNotes?: string;
  items: CreateOrderItemPayload[];
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  note?: string;
}

/* ------------------------------------------------------------ pagination --- */

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/* ---------------------------------------------------------- api envelope --- */

/** Shape of every non-2xx response, produced by the API's exception filter. */
export interface ApiError {
  statusCode: number;
  message: string;
  /** Field-level validation failures, keyed by property path. */
  errors?: Record<string, string[]>;
  path: string;
  timestamp: string;
}
