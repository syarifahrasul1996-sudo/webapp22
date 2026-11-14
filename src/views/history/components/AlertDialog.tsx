import { createPortal } from 'react-dom';
import { AlertCircle, Check } from 'lucide-react';
import type { HistoryController } from '../useHistoryController';

export function AlertDialog({ c }: { c: HistoryController }) {
  const { alertMsg, setAlertMsg } = c;
  return (
    <>
      {alertMsg && createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setAlertMsg(null)}
      />
      <div className="relative bg-white rounded-3xl p-6 w-full max-w-[320px] shadow-2xl animate-fade-in-up">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
            alertMsg.type === 'error' ? 'bg-red-100 text-red-500' :
            alertMsg.type === 'success' ? 'bg-green-100 text-green-500' :
            'bg-blue-100 text-blue-500'
          }`}>
            {alertMsg.type === 'success' ? <Check className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          {alertMsg.title && (
            <h3 className="text-lg font-bold text-text">
              {alertMsg.title}
            </h3>
          )}
          <p className="text-sm text-subtext pb-4">
            {alertMsg.message}
          </p>
          <button
            type="button"
            onClick={() => setAlertMsg(null)}
            className="w-full py-3 px-4 rounded-full font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all"
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  )}
    </>
  );
}
