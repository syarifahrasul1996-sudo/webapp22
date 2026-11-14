import React from 'react';
import { useHistoryState } from './useHistoryState';
import { useHistoryDerived } from './useHistoryDerived';
import { useCloudSync } from './useCloudSync';

export function usePullToRefresh(deps: ReturnType<typeof useHistoryState> & ReturnType<typeof useHistoryDerived> & ReturnType<typeof useCloudSync>) {
  const { handleGlobalSync, isPulling, pullProgress, refreshing, setIsPulling, setPullProgress, setStartY, startY } = deps;


  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || refreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    if (diff > 0) {
      setPullProgress(Math.min(diff * 0.5, 80));
    } else {
      setPullProgress(0);
    }
  };

  const onTouchEnd = () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullProgress >= 60) {
      handleGlobalSync();
    }
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}
