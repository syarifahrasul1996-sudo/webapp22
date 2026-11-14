import { useHistoryController } from './history/useHistoryController';
import { PullToRefreshIndicator } from './history/components/PullToRefreshIndicator';
import { SearchBar } from './history/components/SearchBar';
import { HistoryTabs } from './history/components/HistoryTabs';
import { LocalTab } from './history/components/LocalTab';
import { DraftsTab } from './history/components/DraftsTab';
import { RemoteTab } from './history/components/RemoteTab';
import { TrashTab } from './history/components/TrashTab';
import { ConfirmDialog } from './history/components/ConfirmDialog';
import { AlertDialog } from './history/components/AlertDialog';
import { SyncErrorToast } from './history/components/SyncErrorToast';

export function HistoryView() {
  const c = useHistoryController();
  const { activeTab, onTouchEnd, onTouchMove, onTouchStart } = c;


  return (
    <div
      className="flex flex-col bg-background w-full min-h-screen pb-[calc(env(safe-area-inset-bottom)+8rem)] overscroll-y-contain"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <PullToRefreshIndicator c={c} />

      <div className="p-4 sm:p-6 space-y-4">
        {/* Unified Search Bar */}
        <SearchBar c={c} />

        {/* Tab Segment Selector */}
        <HistoryTabs c={c} />
        {activeTab === 'local' && (
          <LocalTab c={c} />
)}

{activeTab === 'drafts' && (
      <DraftsTab c={c} />
    )}

    {activeTab === 'remote' && (
      <RemoteTab c={c} />
    )}

    {activeTab === 'trash' && (
      <TrashTab c={c} />
    )}
  </div>

  <ConfirmDialog c={c} />

  <AlertDialog c={c} />

  <SyncErrorToast c={c} />
</div>
  );
}
