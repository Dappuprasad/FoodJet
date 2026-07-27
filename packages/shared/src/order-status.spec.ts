import { describe, expect, it } from 'vitest';
import {
  ORDER_STATUSES,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  canTransition,
  isTerminalStatus,
  nextStatus,
  orderStatusStep,
  type OrderStatus,
} from './order-status.js';

describe('order status machine', () => {
  it('labels every status, so the UI can never render a raw enum', () => {
    for (const status of ORDER_STATUSES) {
      expect(ORDER_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it('walks the happy path one step at a time', () => {
    expect(canTransition('RECEIVED', 'PREPARING')).toBe(true);
    expect(canTransition('PREPARING', 'OUT_FOR_DELIVERY')).toBe(true);
    expect(canTransition('OUT_FOR_DELIVERY', 'DELIVERED')).toBe(true);
  });

  it('refuses to skip a stage', () => {
    expect(canTransition('RECEIVED', 'OUT_FOR_DELIVERY')).toBe(false);
    expect(canTransition('RECEIVED', 'DELIVERED')).toBe(false);
    expect(canTransition('PREPARING', 'DELIVERED')).toBe(false);
  });

  it('refuses to move backwards', () => {
    expect(canTransition('PREPARING', 'RECEIVED')).toBe(false);
    expect(canTransition('DELIVERED', 'OUT_FOR_DELIVERY')).toBe(false);
  });

  it('locks terminal states shut', () => {
    for (const terminal of ['DELIVERED', 'CANCELLED'] as OrderStatus[]) {
      expect(isTerminalStatus(terminal)).toBe(true);

      for (const target of ORDER_STATUSES) {
        expect(canTransition(terminal, target)).toBe(false);
      }
    }
  });

  it('allows cancelling only before the rider has left', () => {
    expect(canTransition('RECEIVED', 'CANCELLED')).toBe(true);
    expect(canTransition('PREPARING', 'CANCELLED')).toBe(true);
    expect(canTransition('OUT_FOR_DELIVERY', 'CANCELLED')).toBe(false);
  });

  it('maps each happy-path status to its index for the stepper', () => {
    ORDER_STATUS_FLOW.forEach((status, index) => {
      expect(orderStatusStep(status)).toBe(index);
    });
  });

  it('reports -1 for a cancelled order, which is off the happy path', () => {
    expect(orderStatusStep('CANCELLED')).toBe(-1);
  });

  it('advances along the flow and stops at the end', () => {
    expect(nextStatus('RECEIVED')).toBe('PREPARING');
    expect(nextStatus('OUT_FOR_DELIVERY')).toBe('DELIVERED');
    expect(nextStatus('DELIVERED')).toBeNull();
    expect(nextStatus('CANCELLED')).toBeNull();
  });
});
