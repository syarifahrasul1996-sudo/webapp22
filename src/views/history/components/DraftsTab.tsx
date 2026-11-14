import { Trash2, Save } from 'lucide-react';
import type { HistoryController } from '../useHistoryController';

export function DraftsTab({ c }: { c: HistoryController }) {
  const { appLanguage, deleteDraft, filteredDrafts, loadDraft, setConfirmAction } = c;
  return (
    <div className="space-y-4">
        <div className="mb-1">
          <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50">
            <p className="text-xs text-blue-700 leading-relaxed font-medium">
              {appLanguage === 'ms' 
                ? 'Draf disimpan secara tempatan sahaja dan tidak dihantar ke Google Sheets. Tekan draf untuk memuatkan semula borang.' 
                : 'Drafts are saved locally only and are not sent to Google Sheets. Tap a draft to reload the form.'}
            </p>
          </div>
        </div>

        {filteredDrafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-subtext space-y-4">
            <Save className="w-16 h-16 opacity-30" />
            <p className="font-bold">
              {appLanguage === 'ms' ? 'Tiada draf dijumpai' : 'No drafts found'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredDrafts.map((draft) => {
              const date = new Date(draft.timestamp);
              const formattedDate = date.toLocaleString(appLanguage === 'ms' ? 'ms-MY' : 'en-US', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={draft.id}
                  onClick={() => loadDraft(draft)}
                  className="bg-surface border border-gray-200/60 rounded-xl p-3 flex flex-col space-y-2 hover:border-blue-300 hover:bg-blue-50/5 cursor-pointer active:scale-[0.995] transition-all shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-text truncate">
                        {draft.state.customerName || (appLanguage === 'ms' ? 'Tanpa Nama' : 'Untitled')}
                      </h4>
                      <p className="text-xs text-subtext font-medium">
                        {draft.state.mainType} • {formattedDate}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmAction({
                          title: appLanguage === 'ms' ? 'Padam Draf?' : 'Delete Draft?',
                          message: appLanguage === 'ms' 
                            ? 'Adakah anda pasti mahu memadam draf ini?' 
                            : 'Are you sure you want to delete this draft?',
                          onConfirm: () => {
                            deleteDraft(draft.id);
                            setConfirmAction(null);
                          }
                        });
                      }}
                      className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-100">
                    {draft.state.customerOrder && (
                      <span className="text-[10px] bg-gray-100 text-subtext px-1.5 py-0.5 rounded font-bold">
                        {draft.state.customerOrder}
                      </span>
                    )}
                    {draft.state.customerJenis && (
                      <span className="text-[10px] bg-gray-100 text-subtext px-1.5 py-0.5 rounded font-bold">
                        {draft.state.customerJenis}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
}
