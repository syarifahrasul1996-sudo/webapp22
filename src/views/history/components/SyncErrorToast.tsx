import { createPortal } from 'react-dom';
import { AlertCircle, RefreshCcw, X } from 'lucide-react';
import type { HistoryController } from '../useHistoryController';

export function SyncErrorToast({ c }: { c: HistoryController }) {
  const { appLanguage, handleGlobalSync, setSyncErrorToast, syncErrorToast } = c;
  return (
    <>
      {syncErrorToast && syncErrorToast.visible && createPortal(
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:bottom-[calc(env(safe-area-inset-bottom)+8.5rem)] z-[100] w-full max-w-sm px-4">
      <div className="bg-red-50 text-red-900 border border-red-200 rounded-2xl p-4 shadow-xl flex gap-3 items-start animate-fade-in-up">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        <div className="flex-1 space-y-1">
          <p className="text-xs font-bold leading-tight">
            {appLanguage === 'ms' ? 'Penyelarasan Gagal' : 'Sync Failed'}
          </p>
          <p className="text-[11px] text-red-700/90 leading-normal line-clamp-2">
            {syncErrorToast.message}
          </p>
          <div className="flex gap-2 pt-1.5 justify-start">
            <button
              type="button"
              onClick={() => {
                setSyncErrorToast(null);
                handleGlobalSync(false);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] sm:text-xs active:scale-95 transition-all flex items-center gap-1 shadow-sm"
            >
              <RefreshCcw className="w-3 h-3" />
              {appLanguage === 'ms' ? 'Cuba Lagi' : 'Retry'}
            </button>
            <button
              type="button"
              onClick={() => setSyncErrorToast(null)}
              className="px-3 py-1.5 rounded-lg bg-transparent hover:bg-red-100/50 text-red-700 font-bold text-[10px] sm:text-xs transition-colors"
            >
              {appLanguage === 'ms' ? 'Tutup' : 'Dismiss'}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSyncErrorToast(null)}
          className="text-red-500 hover:text-red-700 transition-colors p-0.5 rounded-lg hover:bg-red-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>,
    document.body
  )}
    </>
  );
}
