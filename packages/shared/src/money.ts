/**
 * All monetary values in this codebase are integers in paise (1 rupee = 100 paise).
 * Floating point is never used for money — `0.1 + 0.2 !== 0.3` is not a rounding
 * quirk you want showing up on an invoice.
 */

export const PAISE_PER_RUPEE = 100;

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * PAISE_PER_RUPEE);
}

export function paiseToRupees(paise: number): number {
  return paise / PAISE_PER_RUPEE;
}

/**
 * Formats paise as an Indian-locale currency string, e.g. 32000 -> "₹320".
 * Whole rupees are rendered without decimals because every price on the menu
 * is a whole number and "₹320.00" reads like a tax form.
 */
export function formatPaise(paise: number): string {
  const rupees = paiseToRupees(paise);
  const hasFraction = paise % PAISE_PER_RUPEE !== 0;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(rupees);
}
