import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CartPage } from './CartPage';
import { buildCartLine, renderWithProviders } from '../test/render';

/**
 * The summary <aside> and the line items both render prices, so assertions are
 * scoped to the summary rather than searching the whole page.
 */
const summary = () => within(screen.getByRole('complementary'));

describe('CartPage', () => {
  it('invites the customer to browse when the cart is empty', () => {
    renderWithProviders(<CartPage />);

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse menu/i })).toBeInTheDocument();
  });

  it('charges delivery below the free-delivery threshold', () => {
    // 1 x ₹320 = ₹320 subtotal, under ₹500.
    renderWithProviders(<CartPage />, { cart: [buildCartLine({ quantity: 1 })] });

    expect(summary().getByText('₹320')).toBeInTheDocument();
    expect(summary().getByText('₹40')).toBeInTheDocument();
    expect(summary().getByText('₹16')).toBeInTheDocument();
    expect(summary().getByText('₹376')).toBeInTheDocument();
    expect(summary().getByText(/add ₹180 more for free delivery/i)).toBeInTheDocument();
  });

  it('waives delivery once the threshold is cleared', () => {
    // 2 x ₹320 = ₹640 subtotal, over ₹500.
    renderWithProviders(<CartPage />, { cart: [buildCartLine({ quantity: 2 })] });

    expect(summary().getByText('FREE')).toBeInTheDocument();
    expect(summary().getByText(/free delivery unlocked/i)).toBeInTheDocument();
    expect(summary().getByText('₹672')).toBeInTheDocument();
  });

  it('recalculates the total when the quantity changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CartPage />, { cart: [buildCartLine({ quantity: 1 })] });

    expect(summary().getByText('₹376')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /increase/i }));

    expect(summary().getByText('₹672')).toBeInTheDocument();
    expect(summary().queryByText('₹376')).not.toBeInTheDocument();
  });

  it('empties the cart when the last line is removed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CartPage />, { cart: [buildCartLine({ quantity: 1 })] });

    await user.click(screen.getByRole('button', { name: /remove butter chicken/i }));

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('recovers from a corrupted cart in storage instead of crashing', () => {
    localStorage.setItem('foodjet.cart', '{"not":"an array"}');

    renderWithProviders(<CartPage />);

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('discards stored lines that do not match the current shape', () => {
    // A line written by an older build, before menuItemId existed.
    localStorage.setItem(
      'foodjet.cart',
      JSON.stringify([{ id: 7, name: 'Legacy Dish', price: 120, quantity: 1 }]),
    );

    renderWithProviders(<CartPage />);

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.queryByText('Legacy Dish')).not.toBeInTheDocument();
  });
});
