import { RefreshCcw, Search, X } from 'lucide-react';
import type { HistoryController } from '../useHistoryController';

export function SearchBar({ c }: { c: HistoryController }) {
  const { activeTab, appLanguage, handleGlobalSync, handleRemoteSearch, isSearching, refreshing, searchQuery, setSearchQuery } = c;
  return (
    <div className="flex gap-2 mb-2">
          <div className="relative flex-1 group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (activeTab === 'remote') {
                    handleRemoteSearch();
                  } else {
                    // Optional: maybe auto-switch to remote if searching? 
                    // For now, just allow filtering local.
                  }
                }
              }}
              placeholder={appLanguage === 'ms' ? 'Cari nama, Order ID, atau no. telefon...' : 'Search name, Order ID, or phone...'}
              className="w-full h-11 bg-gray-100/80 dark:bg-zinc-900/50 rounded-xl pl-10 pr-10 font-bold text-text border border-transparent outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-primary/50 focus:ring-2 ring-primary/10 transition-all text-[11px] sm:text-xs placeholder:text-gray-400 placeholder:font-medium"
            />
            <Search className="w-4 h-4 text-subtext/75 absolute left-3.5 top-3.5" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3 w-5 h-5 rounded-full bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-subtext flex items-center justify-center transition-colors"
              >
                <X className="w-3" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'remote') {
                handleRemoteSearch();
              } else {
                handleGlobalSync(false);
              }
            }}
            disabled={refreshing || isSearching}
            className="w-11 h-11 bg-gray-100/80 dark:bg-zinc-900/50 text-subtext hover:bg-gray-200 dark:hover:bg-zinc-800 active:scale-95 flex items-center justify-center rounded-xl transition-all duration-200 shadow-sm"
          >
            {activeTab === 'remote' ? (
              isSearching ? <RefreshCcw className="w-4 h-4 animate-spin text-primary" /> : <Search className="w-4 h-4" />
            ) : (
              <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin text-primary' : ''}`} />
            )}
          </button>
        </div>
  );
}
