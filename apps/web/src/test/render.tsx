import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import type { MenuItem, Order } from '@foodjet/shared';
import { ToastStack } from '../components/ToastStack';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import type { CartLine } from '../context/cart-context';
import { ToastProvider } from '../context/ToastContext';

interface Options extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  /** Seeds the cart before mount, since CartProvider hydrates from storage. */
  cart?: CartLine[];
}

export function renderWithProviders(ui: ReactElement, options: Options = {}): RenderResult {
  const { route = '/', cart, ...rest } = options;

  if (cart) {
    localStorage.setItem('foodjet.cart', JSON.stringify(cart));
  }

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              {/* Mounted here as well as in App so tests can assert on the
                  toasts components raise. */}
              <ToastStack />
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...rest });
}

export function buildMenuItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'butter-chicken',
    name: 'Butter Chicken',
    description: 'Creamy tomato curry with tender chicken',
    pricePaise: 32000,
    imageUrl: '/images/butter-chicken.jpg',
    category: 'Main Course',
    isVegetarian: false,
    spiceLevel: 1,
    preparationMinutes: 25,
    rating: 4.8,
    ratingCount: 1284,
    isAvailable: true,
    ...overrides,
  };
}

export function buildCartLine(overrides: Partial<CartLine> = {}): CartLine {
  return {
    menuItemId: '11111111-1111-4111-8111-111111111111',
    name: 'Butter Chicken',
    imageUrl: '/images/butter-chicken.jpg',
    unitPricePaise: 32000,
    quantity: 1,
    ...overrides,
  };
}

export function buildOrder(overrides: Partial<Order> = {}): Order {
  const now = new Date().toISOString();

  return {
    id: '33333333-3333-4333-8333-333333333333',
    reference: 'FJ-7QK4M2',
    status: 'RECEIVED',
    items: [
      {
        id: 'line-1',
        menuItemId: '11111111-1111-4111-8111-111111111111',
        name: 'Butter Chicken',
        imageUrl: '/images/butter-chicken.jpg',
        unitPricePaise: 32000,
        quantity: 2,
        lineTotalPaise: 64000,
      },
    ],
    customerName: 'Rahul Sharma',
    phone: '9876543210',
    addressLine: '42, MG Road, Koramangala, Bangalore 560034',
    deliveryNotes: null,
    subtotalPaise: 64000,
    deliveryFeePaise: 0,
    taxPaise: 3200,
    totalPaise: 67200,
    estimatedDeliveryAt: new Date(Date.now() + 40 * 60_000).toISOString(),
    placedAt: now,
    updatedAt: now,
    timeline: [{ status: 'RECEIVED', occurredAt: now, note: 'We have your order' }],
    ...overrides,
  };
}
