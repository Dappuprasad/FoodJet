import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrderStatusStepper } from './OrderStatusStepper';

describe('OrderStatusStepper', () => {
  it('marks the current stage and completes the ones before it', () => {
    render(<OrderStatusStepper status="OUT_FOR_DELIVERY" />);

    const steps = screen.getAllByRole('listitem');

    expect(steps[0]).toHaveClass('completed');
    expect(steps[1]).toHaveClass('completed');
    expect(steps[2]).toHaveClass('active');
    expect(steps[3]).toHaveClass('pending');
  });

  it('marks the whole path complete on delivery', () => {
    render(<OrderStatusStepper status="DELIVERED" />);

    const steps = screen.getAllByRole('listitem');

    expect(steps.slice(0, 3).every((step) => step.classList.contains('completed'))).toBe(
      true,
    );
    expect(steps[3]).toHaveClass('active');
  });

  it('exposes the current stage to assistive technology', () => {
    render(<OrderStatusStepper status="PREPARING" />);

    expect(screen.getByText('Preparing').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    );
  });

  it('replaces the stepper entirely for a cancelled order', () => {
    render(<OrderStatusStepper status="CANCELLED" />);

    expect(screen.getByText('Order cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
