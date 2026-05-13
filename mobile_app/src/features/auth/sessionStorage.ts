import { secureStorage } from '@/core/storage/secureStorage';
import { STORAGE_KEYS } from '@/core/storage/storageKeys';

export async function readHasSession(): Promise<boolean> {
  const token = await secureStorage.getItem(STORAGE_KEYS.authSession);
  return Boolean(token && token.length > 0);
}

/** Persist only a real session token returned from your auth API. */
export async function writeSessionToken(token: string): Promise<void> {
  await secureStorage.setItem(STORAGE_KEYS.authSession, token);
}

export async function clearSession(): Promise<void> {
  await secureStorage.removeItem(STORAGE_KEYS.authSession);
}

/** Removes dev-only placeholder tokens written before real auth existed. */
export async function clearLegacyPlaceholderSession(): Promise<void> {
  const t = await secureStorage.getItem(STORAGE_KEYS.authSession);
  if (!t) {
    return;
  }
  if (t === 'local-registration-complete' || t === 'local-login-otp-complete') {
    await clearSession();
  }
}
