/** Turn API / Squad messages into plain language for registration UI. */
export function humanizeRegistrationError(raw: string): string {
  const lower = raw.toLowerCase();

  if (
    lower.includes('date of birth') ||
    lower.includes('"dob"') ||
    lower.includes('dob must') ||
    (lower.includes('dob') && lower.includes('format'))
  ) {
    return 'Your date of birth must match your BVN and bank records exactly. Use the date picker — the same day, month, and year your bank has (for example 12/04/1995).';
  }

  if (lower.includes('verification') && lower.includes('fail')) {
    return 'Bank verification failed. Check that your full name, BVN, and date of birth match your bank account exactly, then tap Try again.';
  }

  if (lower.includes('bvn')) {
    return 'Your BVN could not be verified. Check that your name, date of birth, and BVN match your bank account.';
  }

  if (lower.includes('email') && lower.includes('exist')) {
    return 'An account with this email already exists. Sign in or use a different email.';
  }

  if (lower.includes('phone') && lower.includes('exist')) {
    return 'An account with this phone number already exists. Sign in or use a different number.';
  }

  if (lower.includes('password') && lower.includes('8')) {
    return 'Your password must be at least 8 characters.';
  }

  if (lower.includes('phone') && (lower.includes('pattern') || lower.includes('valid'))) {
    return 'Enter a valid Nigerian phone number (10–11 digits, starting with 07, 08, or 09).';
  }

  if (lower.includes('virtual account') || lower.includes('squad')) {
    return 'Your profile was saved, but your funding account is not ready yet. Confirm your BVN, name, and date of birth with your bank, then tap Try again.';
  }

  return raw.length > 160 ? 'We could not finish setting up your account. Please check your details and try again.' : raw;
}

export function humanizeVirtualAccountWarning(raw: string | undefined | null): string | null {
  if (!raw?.trim()) {
    return null;
  }
  return humanizeRegistrationError(raw);
}
