/** Formats whole-naira amounts for display (NG locale grouping). */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}
