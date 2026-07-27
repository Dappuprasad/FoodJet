import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as RouterModule from 'react-router-dom';
import { CheckoutPage } from './CheckoutPage';
import { ApiError } from '../lib/api-error';
import { buildCartLine, buildOrder, renderWithProviders } from '../test/render';

const navigate = vi.fn();

// Only useNavigate is stubbed; MemoryRouter and Link stay real so the page
// renders as it actually does.
vi.mock('react-router-dom', async (): Promise<typeof RouterModule> => {
  const actual = await vi.importActual<typeof RouterModule>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('../lib/api-client', () => ({
  api: {
    createOrder: vi.fn(),
    getAccessToken: vi.fn(() => null),
    me: vi.fn(),
    setSessionExpiredHandler: vi.fn(),
  },
}));

const { api } = await import('../lib/api-client');
const createOrder = vi.mocked(api.createOrder);

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/full name/i), 'Rahul Sharma');
  await user.type(screen.getByLabelText(/phone number/i), '9876543210');
  await user.type(
    screen.getByLabelText(/delivery address/i),
    '42, MG Road, Koramangala, Bangalore 560034',
  );
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    createOrder.mockReset();
  });

  it('blocks submission and flags every empty field', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CheckoutPage />, { cart: [buildCartLine()] });

    await user.click(screen.getByRole('button', { name: /place order/i }));

    expect(screen.getByText('Enter your full name')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid 10-digit mobile number')).toBeInTheDocument();
    expect(screen.getByText('Enter a complete delivery address')).toBeInTheDocument();
    expect(createOrder).not.toHaveBeenCalled();
  });

  it('rejects a phone number that is too short', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CheckoutPage />, { cart: [buildCartLine()] });

    await user.type(screen.getByLabelText(/full name/i), 'Rahul Sharma');
    await user.type(screen.getByLabelText(/phone number/i), '98765');
    await user.type(
      screen.getByLabelText(/delivery address/i),
      '42, MG Road, Koramangala, Bangalore 560034',
    );
    await user.click(screen.getByRole('button', { name: /place order/i }));

    expect(screen.getByText('Enter a valid 10-digit mobile number')).toBeInTheDocument();
    expect(createOrder).not.toHaveBeenCalled();
  });

  it('sends only ids and quantities, never prices or totals', async () => {
    const user = userEvent.setup();
    createOrder.mockResolvedValue(buildOrder());

    renderWithProviders(<CheckoutPage />, { cart: [buildCartLine({ quantity: 2 })] });

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(1));

    const payload = createOrder.mock.calls[0]![0];

    expect(payload.items).toEqual([
      { menuItemId: '11111111-1111-4111-8111-111111111111', quantity: 2 },
    ]);

    // The server is the only thing allowed to decide what an order costs.
    const serialised = JSON.stringify(payload);
    expect(serialised).not.toContain('unitPricePaise');
    expect(serialised).not.toContain('totalPaise');
  });

  it('navigates to tracking once the order is accepted', async () => {
    const user = userEvent.setup();
    const order = buildOrder();
    createOrder.mockResolvedValue(order);

    renderWithProviders(<CheckoutPage />, { cart: [buildCartLine()] });

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(`/track/${order.id}`, { replace: true }),
    );
  });

  it('maps server field errors back onto the inputs that caused them', async () => {
    const user = userEvent.setup();
    createOrder.mockRejectedValue(
      new ApiError('Validation failed', 400, {
        phone: ['Enter a valid 10-digit Indian mobile number'],
      }),
    );

    renderWithProviders(<CheckoutPage />, { cart: [buildCartLine()] });

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() =>
      expect(
        screen.getByText('Enter a valid 10-digit Indian mobile number'),
      ).toBeInTheDocument(),
    );
  });

  it('keeps the cart intact when the order fails, so nothing is lost', async () => {
    const user = userEvent.setup();
    createOrder.mockRejectedValue(new ApiError('Kitchen is closed', 422));

    renderWithProviders(<CheckoutPage />, { cart: [buildCartLine({ quantity: 2 })] });

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => expect(screen.getByText('Kitchen is closed')).toBeInTheDocument());

    expect(screen.getByText('Butter Chicken')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sends the customer back to the menu with an empty cart', () => {
    renderWithProviders(<CheckoutPage />);

    expect(screen.getByText('Nothing to check out')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /place order/i })).not.toBeInTheDocument();
  });
});
