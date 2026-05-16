const KOBO_PER_NAIRA = 100;

export function koboToNaira(kobo: number): number {
  return kobo / KOBO_PER_NAIRA;
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * KOBO_PER_NAIRA);
}
