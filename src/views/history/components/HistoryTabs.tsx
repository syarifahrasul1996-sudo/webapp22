import { Clock, Trash2, Save, Database } from 'lucide-react';
import type { HistoryController } from '../useHistoryController';

export function HistoryTabs({ c }: { c: HistoryController }) {
  const { activeTab, appLanguage, history, setActiveTab, setSearchError } = c;
  return (
    <div className="flex bg-gray-100/80 p-1 rounded-xl shadow-sm mb-1">
          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`flex-1 text-center text-[10px] sm:text-xs font-bold py-2 px-1 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1 ${
              activeTab === 'local'
                ? 'bg-white text-primary shadow-sm'
                : 'text-subtext/70 hover:text-text hover:bg-white/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="truncate">{appLanguage === 'ms' ? 'Sejarah' : 'History'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('drafts')}
            className={`flex-1 text-center text-[10px] sm:text-xs font-bold py-2 px-1 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1 ${
              activeTab === 'drafts'
                ? 'bg-white text-primary shadow-sm'
                : 'text-subtext/70 hover:text-text hover:bg-white/40'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span className="truncate">{appLanguage === 'ms' ? 'Draf' : 'Drafts'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('remote');
              setSearchError('');
            }}
            className={`flex-1 text-center text-[10px] sm:text-xs font-bold py-2 px-1 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1 ${
              activeTab === 'remote'
                ? 'bg-white text-primary shadow-sm'
                : 'text-subtext/70 hover:text-text hover:bg-white/40'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="truncate">{appLanguage === 'ms' ? 'Cari Cloud' : 'Cloud Search'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('trash');
            }}
            className={`flex-1 text-center text-[10px] sm:text-xs font-bold py-2 px-1 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1 ${
              activeTab === 'trash'
                ? 'bg-rose-50 border border-rose-200/50 dark:bg-rose-950/20 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-subtext/70 hover:text-text hover:bg-white/40'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="truncate">{appLanguage === 'ms' ? 'Tong Sampah' : 'Trash Bin'}</span>
            {(() => {
              const deletedCount = history.filter(item => item?.state?.isDeleted).length;
              return deletedCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[9px] font-black bg-rose-600 dark:bg-rose-500 text-white rounded-full scale-90 select-none animate-pulse">
                  {deletedCount}
                </span>
              ) : null;
            })()}
          </button>
        </div>
  );
}
