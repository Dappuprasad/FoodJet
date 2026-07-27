import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MenuCard } from './MenuCard';
import { buildMenuItem, renderWithProviders } from '../test/render';

describe('MenuCard', () => {
  it('renders the dish with its price formatted in rupees', () => {
    renderWithProviders(<MenuCard item={buildMenuItem()} />);

    expect(screen.getByRole('heading', { name: 'Butter Chicken' })).toBeInTheDocument();
    // 32000 paise must reach the screen as ₹320, not as 32000.
    expect(screen.getByText('₹320')).toBeInTheDocument();
    expect(screen.queryByText('32000')).not.toBeInTheDocument();
  });

  it('swaps the Add button for quantity controls once added', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MenuCard item={buildMenuItem()} />);

    await user.click(screen.getByRole('button', { name: /add butter chicken to cart/i }));

    expect(
      screen.queryByRole('button', { name: /add butter chicken to cart/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('increments and decrements the quantity', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MenuCard item={buildMenuItem()} />);

    await user.click(screen.getByRole('button', { name: /add butter chicken to cart/i }));
    await user.click(screen.getByRole('button', { name: /increase/i }));
    expect(screen.getByText('2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /decrease/i }));
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('returns to the Add button when the last one is removed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MenuCard item={buildMenuItem()} />);

    await user.click(screen.getByRole('button', { name: /add butter chicken to cart/i }));
    await user.click(screen.getByRole('button', { name: /decrease/i }));

    expect(
      screen.getByRole('button', { name: /add butter chicken to cart/i }),
    ).toBeInTheDocument();
  });

  it('marks vegetarian dishes and leaves others unmarked', () => {
    const { unmount } = renderWithProviders(
      <MenuCard item={buildMenuItem({ isVegetarian: true })} />,
    );
    expect(screen.getByLabelText('Vegetarian')).toBeInTheDocument();

    unmount();

    renderWithProviders(<MenuCard item={buildMenuItem({ isVegetarian: false })} />);
    expect(screen.queryByLabelText('Vegetarian')).not.toBeInTheDocument();
  });
});
