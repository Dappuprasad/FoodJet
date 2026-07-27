import { Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';
import type { Order } from '@foodjet/shared';

export const ORDER_INCLUDE = {
  items: { orderBy: { name: 'asc' } },
  timeline: { orderBy: { occurredAt: 'asc' } },
} satisfies Prisma.OrderInclude;

export type OrderRecord = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

export function toOrder(record: OrderRecord): Order {
  return {
    id: record.id,
    reference: record.reference,
    status: record.status,
    items: record.items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId ?? '',
      name: item.name,
      imageUrl: item.imageUrl,
      unitPricePaise: item.unitPricePaise,
      quantity: item.quantity,
      lineTotalPaise: item.lineTotalPaise,
    })),
    customerName: record.customerName,
    phone: record.phone,
    addressLine: record.addressLine,
    deliveryNotes: record.deliveryNotes,
    subtotalPaise: record.subtotalPaise,
    deliveryFeePaise: record.deliveryFeePaise,
    taxPaise: record.taxPaise,
    totalPaise: record.totalPaise,
    estimatedDeliveryAt: record.estimatedDeliveryAt.toISOString(),
    placedAt: record.placedAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    timeline: record.timeline.map((event) => ({
      status: event.status,
      occurredAt: event.occurredAt.toISOString(),
      note: event.note,
    })),
  };
}

/**
 * Crockford base32 minus the characters that get misread over the phone
 * (I, L, O, U). A reference is quotable to support without spelling it out.
 */
const REFERENCE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateOrderReference(): string {
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  }
  return `FJ-${suffix}`;
}
