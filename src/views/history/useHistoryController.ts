import { useHistoryState } from './useHistoryState';
import { useHistoryDerived } from './useHistoryDerived';
import { useCloudSync } from './useCloudSync';
import { usePullToRefresh } from './usePullToRefresh';
import { useRemoteOrders } from './useRemoteOrders';

/** Composes the History view's state, derived data and actions into one object. */
export function useHistoryController() {
  const state = useHistoryState();
  const derived = useHistoryDerived(state);
  const cloud = useCloudSync({ ...state, ...derived });
  const pull = usePullToRefresh({ ...state, ...derived, ...cloud });
  const remote = useRemoteOrders({ ...state, ...derived, ...cloud, ...pull });
  return { ...state, ...derived, ...cloud, ...pull, ...remote };
}

export type HistoryController = ReturnType<typeof useHistoryController>;
