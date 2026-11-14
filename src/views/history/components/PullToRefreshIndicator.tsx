import { RefreshCcw } from 'lucide-react';
import type { HistoryController } from '../useHistoryController';

export function PullToRefreshIndicator({ c }: { c: HistoryController }) {
  const { isPulling, pullProgress, refreshing } = c;
  return (
    <div
        className="w-full flex items-center justify-center overflow-hidden"
        style={{
          height: `${pullProgress}px`,
          transition: isPulling && !refreshing ? 'none' : 'height 0.3s ease-out'
        }}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full bg-surface shadow-sm text-subtext"
          style={{
            transform: refreshing ? 'none' : `rotate(${pullProgress * 4}deg)`,
            opacity: pullProgress / 40 > 1 ? 1 : pullProgress / 40
          }}
        >
          <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin text-primary' : ''}`} />
        </div>
      </div>
  );
}
