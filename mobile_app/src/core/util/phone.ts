/** Normalize 10–11 digit local input to 080… format accepted by the backend. */
export function formatNigerianPhone(digits: string): string {
  const d = digits.replace(/\D/g, '');
  if (d.length === 10 && /^[789]/.test(d)) {
    return `0${d}`;
  }
  if (d.length === 11 && d.startsWith('0')) {
    return d;
  }
  if (d.length === 13 && d.startsWith('234')) {
    return `0${d.slice(3)}`;
  }
  return d;
}

/** Login/register identifier: prefer local 080… form. */
export function phoneIdentifierFromDigits(digits: string): string {
  return formatNigerianPhone(digits);
}
