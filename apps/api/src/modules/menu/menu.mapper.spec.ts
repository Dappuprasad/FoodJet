import { slugify } from './menu.mapper';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Butter Chicken')).toBe('butter-chicken');
  });

  it('drops punctuation instead of encoding it', () => {
    expect(slugify('Chef’s Special: Rogan Josh!')).toBe('chef-s-special-rogan-josh');
  });

  it('collapses runs of separators and trims the edges', () => {
    expect(slugify('  --Paneer   Tikka--  ')).toBe('paneer-tikka');
  });

  it('caps length so the column limit is never the thing that fails', () => {
    expect(slugify('a'.repeat(200)).length).toBeLessThanOrEqual(60);
  });

  it('returns an empty string for input with nothing sluggable in it', () => {
    // The caller substitutes a default; this documents that it must.
    expect(slugify('!!!')).toBe('');
  });
});
