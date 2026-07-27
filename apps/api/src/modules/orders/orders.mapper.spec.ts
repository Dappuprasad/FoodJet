import { generateOrderReference } from './orders.mapper';

describe('generateOrderReference', () => {
  it('produces the documented FJ-XXXXXX shape', () => {
    expect(generateOrderReference()).toMatch(/^FJ-[0-9A-HJKMNP-TV-Z]{6}$/);
  });

  it('omits the characters that get misheard over the phone', () => {
    const sample = Array.from({ length: 400 }, generateOrderReference).join('');
    expect(sample).not.toMatch(/[ILOU]/);
  });

  it('does not repeat itself across a realistic batch', () => {
    const references = new Set(Array.from({ length: 1000 }, generateOrderReference));
    // 32^6 keyspace, so a collision in 1000 draws would signal a broken RNG.
    expect(references.size).toBe(1000);
  });
});
