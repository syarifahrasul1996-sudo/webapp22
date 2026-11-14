import { useMemo } from 'react';
import { reconcileOrdersByUniqueId } from '../../utils';
import { getOrderDueTimestamp } from '../../utils/orderWindow';
import { useHistoryState } from './useHistoryState';

export function useHistoryDerived(deps: ReturnType<typeof useHistoryState>) {
  const { currentTime, deliveryFilter, drafts, history, pendingTimeFilter, searchQuery } = deps;


  const localizedHistoryItems = useMemo(() => {
    const reconciled = reconcileOrdersByUniqueId(history);
    return reconciled.filter(Boolean).filter((item) => {
      if (item.state?.isDeleted) return false;
      if (deliveryFilter === 'delivered' && !item.state?.isDelivered) return false;
      if (deliveryFilter === 'pending' && item.state?.isDelivered) return false;
      
      // If pending filter is active, apply sub-time filters
      if (deliveryFilter === 'pending' && pendingTimeFilter !== 'all') {
        const orderTime = getOrderDueTimestamp(item);
        if (!orderTime) return false;

        const d = new Date(orderTime);
        d.setHours(0, 0, 0, 0);
        const orderDateTs = d.getTime();

        const n = new Date(currentTime);
        n.setHours(0, 0, 0, 0);
        const todayTs = n.getTime();

        const t = new Date(n);
        t.setDate(n.getDate() + 1);
        const tomorrowTs = t.getTime();

        const d2 = new Date(n);
        d2.setDate(n.getDate() + 2);
        const day2Ts = d2.getTime();

        const d3 = new Date(n);
        d3.setDate(n.getDate() + 3);
        const day3Ts = d3.getTime();

        if (pendingTimeFilter === 'today' && orderDateTs > todayTs) return false;
        if (pendingTimeFilter === 'tomorrow' && orderDateTs !== tomorrowTs) return false;
        if (pendingTimeFilter === '2days' && orderDateTs !== day2Ts) return false;
        if (pendingTimeFilter === '3days' && orderDateTs !== day3Ts) return false;
      }
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = String(item.state?.customerName || '').toLowerCase().includes(query);
        const idMatch = String(item.state?.orderId || '').toLowerCase().includes(query);
        const phoneMatch = String(item.state?.customerPhone || '').toLowerCase().includes(query);
        if (!nameMatch && !idMatch && !phoneMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      const aDelivered = !!a.state?.isDelivered;
      const bDelivered = !!b.state?.isDelivered;

      // 1. Pending orders appear above delivered orders
      if (!aDelivered && bDelivered) return -1;
      if (aDelivered && !bDelivered) return 1;

      const aDue = getOrderDueTimestamp(a);
      const bDue = getOrderDueTimestamp(b);

      if (!aDelivered) {
        // Pending orders:
        // Both have due dates -> sort chronologically ascending by due date (earliest deadline / overdue first)
        if (aDue !== null && bDue !== null) {
          if (aDue !== bDue) {
            return aDue - bDue;
          }
          // Same deadline -> latest modified/created first
          return (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0);
        }

        // Only one has a due date -> order with due date comes first
        if (aDue !== null && bDue === null) return -1;
        if (aDue === null && bDue !== null) return 1;

        // Neither has a due date -> latest created/edited first
        return (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0);
      }

      // Delivered orders: latest due date or completion timestamp first (descending)
      if (aDue !== null && bDue !== null) {
        if (aDue !== bDue) {
          return bDue - aDue;
        }
        return (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0);
      }

      if (aDue !== null && bDue === null) return -1;
      if (aDue === null && bDue !== null) return 1;

      return (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0);
    });
  }, [history, deliveryFilter, pendingTimeFilter, searchQuery, currentTime]);

  const filteredDrafts = useMemo(() => {
    if (!searchQuery.trim()) return drafts;
    const query = searchQuery.toLowerCase().trim();
    return drafts.filter(draft => {
      const nameMatch = String(draft.data?.customerName || draft.data?.name || '').toLowerCase().includes(query);
      const phoneMatch = String(draft.data?.customerPhone || draft.data?.phone || '').toLowerCase().includes(query);
      const typeMatch = String(draft.type || '').toLowerCase().includes(query);
      const orderMatch = String(draft.data?.mainType || '').toLowerCase().includes(query);
      return nameMatch || phoneMatch || typeMatch || orderMatch;
    });
  }, [drafts, searchQuery]);

  const filteredTrash = useMemo(() => {
    const deletedItems = history.filter(item => item?.state?.isDeleted);
    if (!searchQuery.trim()) return deletedItems;
    const query = searchQuery.toLowerCase().trim();
    return deletedItems.filter(item => {
      const nameMatch = String(item.state?.customerName || item.state?.name || '').toLowerCase().includes(query);
      const idMatch = String(item.state?.orderId || '').toLowerCase().includes(query);
      const phoneMatch = String(item.state?.customerPhone || '').toLowerCase().includes(query);
      return nameMatch || idMatch || phoneMatch;
    });
  }, [history, searchQuery]);

  const pendingStats = useMemo(() => {
    const now = new Date(currentTime);
    now.setHours(0, 0, 0, 0);
    const todayTs = now.getTime();
    
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowTs = tomorrow.getTime();

    const day2 = new Date(now);
    day2.setDate(now.getDate() + 2);
    const day2Ts = day2.getTime();

    const day3 = new Date(now);
    day3.setDate(now.getDate() + 3);
    const day3Ts = day3.getTime();

    let todayCount = 0;
    let tomorrowCount = 0;
    let day2Count = 0;
    let day3Count = 0;

    // Use reconciled history for stats to prevent duplicate counting
    const reconciled = reconcileOrdersByUniqueId(history);
    reconciled.forEach(item => {
      if (item.state?.isDeleted || item.state?.isDelivered) return;
      
      const due = getOrderDueTimestamp(item);
      if (!due) return;
      
      const dueDate = new Date(due);
      dueDate.setHours(0, 0, 0, 0);
      const dueDateTs = dueDate.getTime();
      
      if (dueDateTs <= todayTs) todayCount++;
      else if (dueDateTs === tomorrowTs) tomorrowCount++;
      else if (dueDateTs === day2Ts) day2Count++;
      else if (dueDateTs === day3Ts) day3Count++;
    });

    return { today: todayCount, tomorrow: tomorrowCount, day2: day2Count, day3: day3Count };
  }, [history, currentTime]);

  return { localizedHistoryItems, filteredDrafts, filteredTrash, pendingStats };
}
