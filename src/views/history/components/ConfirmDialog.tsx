import { createPortal } from 'react-dom';
import { cn } from '../../../cn';
import { AlertCircle, RefreshCcw, Check } from 'lucide-react';
import type { HistoryController } from '../useHistoryController';

export function ConfirmDialog({ c }: { c: HistoryController }) {
  const { appLanguage, confirmAction, isConfirmLoading, setConfirmAction, setIsConfirmLoading } = c;
  return (
    <>
      {confirmAction && createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setConfirmAction(null)}
      />

      <div className="relative bg-white rounded-3xl p-6 w-full max-w-[320px] shadow-2xl animate-fade-in-up">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center mb-2",
            confirmAction.isDestructive !== false 
              ? "bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400" 
              : "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
          )}>
            {confirmAction.isDestructive !== false ? (
              <AlertCircle className="w-6 h-6" />
            ) : (
              <Check className="w-6 h-6" />
            )}
          </div>

          <h3 className="text-lg font-bold text-text">
            {confirmAction.title || (appLanguage === 'ms' ? 'Pasti?' : 'Are you sure?')}
          </h3>

          <p className="text-sm text-subtext pb-4">
            {confirmAction.message}
          </p>

          <div className="flex w-full space-x-3">
            <button
              type="button"
              disabled={isConfirmLoading}
              onClick={() => {
                if (isConfirmLoading) return;
                setConfirmAction(null);
              }}
              className="flex-1 py-3 px-4 rounded-full font-bold text-sm text-text bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50"
            >
              {confirmAction.cancelText || (appLanguage === 'ms' ? 'Batal' : 'Cancel')}
            </button>

            <button
              type="button"
              disabled={isConfirmLoading}
              onClick={async () => {
                if (isConfirmLoading) return;
                try {
                  const result = confirmAction.onConfirm();
                  if (result instanceof Promise) {
                    setIsConfirmLoading(true);
                    await result;
                  }
                } finally {
                  setIsConfirmLoading(false);
                }
              }}
              className={cn(
                "flex-1 py-3 px-4 rounded-full font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center shadow-sm",
                confirmAction.isDestructive !== false ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {isConfirmLoading ? (
                <RefreshCcw className="w-4 h-4 animate-spin" />
              ) : (
                confirmAction.confirmText || (appLanguage === 'ms' ? 'Padam' : 'Delete')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )}
    </>
  );
}
