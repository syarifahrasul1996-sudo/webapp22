import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { STORAGE_WRITE_FAILED_EVENT, StorageWriteFailedDetail } from '../lib/safeStorage';

/**
 * Shown when the browser refuses to save data (storage full or blocked), so the person knows
 * recent changes may not survive a reload instead of finding out later.
 */
export function StorageWarning() {
  const { appLanguage } = useAppContext();
  const [detail, setDetail] = useState<StorageWriteFailedDetail | null>(null);

  useEffect(() => {
    const onFailed = (e: Event) => setDetail((e as CustomEvent<StorageWriteFailedDetail>).detail);
    window.addEventListener(STORAGE_WRITE_FAILED_EVENT, onFailed);
    return () => window.removeEventListener(STORAGE_WRITE_FAILED_EVENT, onFailed);
  }, []);

  if (!detail) return null;
  const ms = appLanguage === 'ms';
  const message = detail.quotaExceeded
    ? ms
      ? 'Storan peranti penuh. Perubahan terkini mungkin tidak disimpan. Padam sejarah lama atau draf yang tidak perlu.'
      : 'Device storage is full. Recent changes may not be saved. Delete old history or drafts you no longer need.'
    : ms
      ? 'Penyimpanan pelayar disekat. Perubahan mungkin hilang apabila halaman dimuat semula.'
      : 'Browser storage is blocked. Changes may be lost when the page reloads.';

  return (
    <div
      role="alert"
      data-testid="storage-warning"
      className="fixed left-3 right-3 top-3 z-[80] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 shadow-lg dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1">{message}</p>
      <button
        type="button"
        onClick={() => setDetail(null)}
        aria-label={ms ? 'Tutup' : 'Dismiss'}
        className="shrink-0 rounded-full p-1 hover:bg-amber-100 dark:hover:bg-amber-900"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
