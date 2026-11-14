import { Trash2, RefreshCcw } from 'lucide-react';
import type { HistoryController } from '../useHistoryController';
import { formatCustomerName } from '../helpers';

export function TrashTab({ c }: { c: HistoryController }) {
  const { appLanguage, filteredTrash, permanentlyDeleteOrderFromHistory, restoreOrderFromHistory, setAlertMsg, setConfirmAction, syncOfflineQueue } = c;
  return (
    <div className="space-y-4 mt-2.5">
        {(() => {
          const deletedItems = filteredTrash;
          
          if (deletedItems.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center py-20 text-subtext space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500/60">
                  <Trash2 className="w-8 h-8 opacity-60" />
                </div>
                <p className="font-bold">
                  {appLanguage === 'ms' ? 'Tong sampah kosong' : 'Trash bin is empty'}
                </p>
                <p className="text-[10px] text-gray-400 text-center max-w-[220px]">
                  {appLanguage === 'ms' 
                    ? 'Rekod yang dipadamkan dari Sejarah akan dipaparkan di sini.' 
                    : 'Deleted records from History will appear here.'}
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-rose-50/50 border border-rose-200/50 rounded-2xl p-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-extrabold text-rose-900">
                    {appLanguage === 'ms' ? 'Tong Sampah' : 'Trash Bin'}
                  </p>
                  <p className="text-[10px] text-rose-700/80">
                    {appLanguage === 'ms' 
                      ? `${deletedItems.length} rekod dipadamkan dikesan.` 
                      : `${deletedItems.length} deleted records detected.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmAction({
                      title: appLanguage === 'ms' ? 'Kosongkan Tong Sampah?' : 'Empty Trash Bin?',
                      message: appLanguage === 'ms'
                        ? 'Adakah anda benar-benar ingin memadamkan semua rekod ini secara kekal dari peranti ini?'
                        : 'Are you sure you want to permanently delete all these records from this device?',
                      onConfirm: () => {
                        deletedItems.forEach(item => {
                          permanentlyDeleteOrderFromHistory(item.id);
                        });
                        setConfirmAction(null);
                        setAlertMsg({
                          type: 'success',
                          message: appLanguage === 'ms' 
                            ? 'Tong sampah telah dibersihkan!' 
                            : 'Trash bin emptied successfully!'
                        });
                      }
                    });
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] sm:text-xs font-black transition-all duration-150 active:scale-95 shadow-sm"
                >
                  {appLanguage === 'ms' ? 'Kosongkan' : 'Empty Trash'}
                </button>
              </div>

              <div className="space-y-3">
                {deletedItems.map((item) => {
                  const customerName = item.state?.customerName || item.state?.name || 'Unknown';
                  const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                  const orderIdHex = item.state?.orderId || item.id;
                  
                  return (
                    <div
                      key={item.id}
                      className="bg-surface border border-gray-100 dark:border-gray-800/40 rounded-2xl p-4 shadow-sm flex flex-col space-y-3.5 hover:border-gray-200 transition-all duration-150 animate-fade-in"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-text">{formatCustomerName(customerName)}</span>
                            {item.state?.customerJenis && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-subtext font-bold rounded-md">
                                {item.state.customerJenis}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-[10px] text-subtext space-x-2 font-semibold">
                            <span>ID: {orderIdHex.substring(0, 10)}</span>
                            <span>•</span>
                            <span>{dateStr}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2.5 pt-1.5 border-t border-dashed border-gray-100/60">
                        <button
                          type="button"
                          onClick={() => {
                            restoreOrderFromHistory(item.id);
                            syncOfflineQueue();
                            setAlertMsg({
                              type: 'success',
                              message: appLanguage === 'ms' 
                                ? 'Rekod berjaya dipulihkan!' 
                                : 'Record restored successfully!'
                            });
                          }}
                          className="flex-1 h-9 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-150 active:scale-[0.97] flex items-center justify-center space-x-1"
                        >
                          <RefreshCcw className="w-3 h-3 rotate-180" />
                          <span>{appLanguage === 'ms' ? 'Pulihkan' : 'Restore'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmAction({
                              title: appLanguage === 'ms' ? 'Padam Kekal?' : 'Delete Permanently?',
                              message: appLanguage === 'ms'
                                ? 'Adakah anda mahu memadam rekod ini selamanya dari peranti ini? Tindakan ini tidak boleh diundur.'
                                : 'Do you want to permanently delete this record from this device? This action cannot be undone.',
                              onConfirm: () => {
                                permanentlyDeleteOrderFromHistory(item.id);
                                setConfirmAction(null);
                                setAlertMsg({
                                  type: 'success',
                                  message: appLanguage === 'ms' 
                                    ? 'Rekod dipadam kekal!' 
                                    : 'Record permanently deleted!'
                                });
                              }
                            });
                          }}
                          className="flex-1 h-9 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-150 active:scale-[0.97] flex items-center justify-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{appLanguage === 'ms' ? 'Padam Kekal' : 'Delete Permanently'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
  );
}
