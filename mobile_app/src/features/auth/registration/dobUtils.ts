/** Calendar date as YYYY-MM-DD (no time zone in storage). */
export type IsoDateString = string;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const LEGACY_SLASH = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

export function formatIsoDateFromParts(year: number, monthIndex: number, day: number): IsoDateString {
  const y = String(year);
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIsoDateString(value: string): Date | null {
  const m = value.trim().match(ISO_DATE);
  if (!m) {
    return null;
  }
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const date = new Date(year, month, day, 12, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function isValidIsoDateString(value: string): boolean {
  return parseIsoDateString(value) !== null;
}

/** Converts saved draft text (legacy DD/MM/YYYY or ISO) into YYYY-MM-DD. */
export function normalizeStoredDob(raw: string): IsoDateString {
  const trimmed = raw.trim();
  if (isValidIsoDateString(trimmed)) {
    return trimmed;
  }
  const slash = trimmed.match(LEGACY_SLASH);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]);
    const year = Number(slash[3]);
    const iso = formatIsoDateFromParts(year, month - 1, day);
    if (isValidIsoDateString(iso)) {
      return iso;
    }
  }
  return '';
}

/**
 * Value sent to POST /auth/register.
 * Uses noon UTC so the backend/Squad DD/MM/YYYY mapping keeps the same calendar day
 * without any backend code changes.
 */
export function formatDobForApi(isoDate: IsoDateString): string {
  if (!isValidIsoDateString(isoDate)) {
    return isoDate;
  }
  return `${isoDate}T12:00:00.000Z`;
}

export function formatIsoDateForDisplay(value: string): string {
  const normalized = normalizeStoredDob(value);
  const date = parseIsoDateString(normalized);
  if (!date) {
    return value || '—';
  }
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatIsoDateForBankHint(value: string): string {
  const normalized = normalizeStoredDob(value);
  const m = normalized.match(ISO_DATE);
  if (!m) {
    return '';
  }
  const [, yyyy, mm, dd] = m;
  return `${dd}/${mm}/${yyyy}`;
}

/** Must match a real date and be at least 18 years old. */
export function isAdultIsoDate(value: string): boolean {
  const birth = parseIsoDateString(normalizeStoredDob(value));
  if (!birth) {
    return false;
  }
  const today = new Date();
  const minAge = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const maxAge = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  return birth <= minAge && birth >= maxAge;
}

export function defaultAdultDobIso(): IsoDateString {
  const d = new Date();
  return formatIsoDateFromParts(d.getFullYear() - 25, d.getMonth(), d.getDate());
}
