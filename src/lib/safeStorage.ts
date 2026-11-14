/**
 * localStorage wrappers that never throw.
 *
 * Browsers throw on writes when storage is full (QuotaExceededError), blocked (some private
 * modes, strict privacy settings) or unavailable. An unguarded write inside a React effect
 * would take down the whole screen, so every write goes through here. A failed write returns
 * false and fires a single `storage-write-failed` window event that the UI can surface.
 */
export const STORAGE_WRITE_FAILED_EVENT = 'storage-write-failed';

export interface StorageWriteFailedDetail {
  key: string;
  quotaExceeded: boolean;
}

let lastNotified = 0;

function isQuotaError(error: unknown): boolean {
  const e = error as { name?: string; code?: number } | null;
  return (
    !!e &&
    (e.name === 'QuotaExceededError' ||
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      e.code === 22 ||
      e.code === 1014)
  );
}

function notify(key: string, error: unknown) {
  console.warn(`[storage] Could not save "${key}":`, error);
  const now = Date.now();
  if (now - lastNotified < 30_000) return; // at most one notice per 30s
  lastNotified = now;
  try {
    window.dispatchEvent(
      new CustomEvent<StorageWriteFailedDetail>(STORAGE_WRITE_FAILED_EVENT, {
        detail: { key, quotaExceeded: isQuotaError(error) },
      })
    );
  } catch {}
}

/** Saves a value. Returns true on success, false (and never throws) on failure. */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    notify(key, error);
    return false;
  }
}

/** Removes a value. Never throws. */
export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}
