import { parseDurationSeconds } from './configuration';

describe('parseDurationSeconds', () => {
  it.each([
    ['30s', 30],
    ['15m', 900],
    ['2h', 7200],
    ['7d', 604_800],
  ])('parses %s as %i seconds', (input, expected) => {
    expect(parseDurationSeconds(input, 1)).toBe(expected);
  });

  it('treats a bare number as seconds', () => {
    expect(parseDurationSeconds('3600', 1)).toBe(3600);
  });

  it('tolerates surrounding whitespace', () => {
    expect(parseDurationSeconds('  10m  ', 1)).toBe(600);
  });

  it('falls back rather than throwing on unparseable input', () => {
    expect(parseDurationSeconds('fifteen minutes', 900)).toBe(900);
    expect(parseDurationSeconds('', 900)).toBe(900);
    expect(parseDurationSeconds('15y', 900)).toBe(900);
  });
});
