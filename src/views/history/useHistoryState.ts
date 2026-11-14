import { useEffect, useState, useRef } from 'react';
import { useAppContext } from '../../AppContext';
import { DEFAULT_SCRIPT_URL, DEFAULT_SPREADSHEET_ID } from '../../config';

export function useHistoryState() {
  const {
    state,
    history,
    setHistory,
    clearHistory,
    deleteOrderFromHistory,
    restoreOrderFromHistory,
    permanentlyDeleteOrderFromHistory,
    loadOrder,
    drafts,
    deleteDraft,
    loadDraft,
    pushView,
    appLanguage,
    updateSpecificHistoryItem,
    updateOrderHistoryState,
    addToOfflineQueue,
    syncOfflineQueue,
    deletedOrderIds,
    historyDeliveryFilter,
    setHistoryDeliveryFilter,
    historyPendingTimeFilter,
    setHistoryPendingTimeFilter
  } = useAppContext();
  const historyRef = useRef(history);
  const deletedOrderIdsRef = useRef(deletedOrderIds);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    deletedOrderIdsRef.current = deletedOrderIds;
  }, [deletedOrderIds]);

  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [confirmAction, setConfirmAction] = useState<{ 
    title?: string; 
    message: string; 
    onConfirm: () => void | Promise<void>; 
    isDestructive?: boolean;
    confirmText?: string;
    cancelText?: string;
  } | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ title?: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [syncErrorToast, setSyncErrorToast] = useState<{ message: string; visible: boolean } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const deliveryFilter = historyDeliveryFilter;
  const setDeliveryFilter = setHistoryDeliveryFilter;
  const pendingTimeFilter = historyPendingTimeFilter;
  const setPendingTimeFilter = setHistoryPendingTimeFilter;
  const [activeTab, setActiveTab] = useState<'local' | 'remote' | 'drafts' | 'trash'>('local');
  const [searchQuery, setSearchQuery] = useState('');
  const [remoteResults, setRemoteResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showDbSettings, setShowDbSettings] = useState(false);
  const [globalScriptUrl, setGlobalScriptUrl] = useState<string>(() => {
    return localStorage.getItem('db_global_script_url') || DEFAULT_SCRIPT_URL;
  });

  useEffect(() => {
  const timer = window.setInterval(() => {
    setCurrentTime(Date.now());
  }, 60 * 1000);

  return () => {
    window.clearInterval(timer);
  };
}, []);


  const [annualSheets, setAnnualSheets] = useState<{ year: string; spreadsheetId: string; scriptUrl: string }[]>(() => {
    try {
      const saved = localStorage.getItem('db_annual_sheets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: any) => ({
            year: String(s.year || ''),
            spreadsheetId: String(s.spreadsheetId || ''),
            scriptUrl: String(s.scriptUrl || '')
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        year: '2024',
        spreadsheetId: '1B9zdWXVLnvj0jNNVnKxcb6cJnS1VLCIdB4j-RR3wOlg',
        scriptUrl: ''
      },
      {
        year: '2025',
        spreadsheetId: '1myU9apnYWWtU3snnCw14qI6ZS05i4DY6oOswLz1sCwo',
        scriptUrl: ''
      },
      {
        year: '2026',
        spreadsheetId: state.spreadsheetId || DEFAULT_SPREADSHEET_ID,
        scriptUrl: ''
      }
    ];
  });

  return { state, history, setHistory, clearHistory, deleteOrderFromHistory, restoreOrderFromHistory, permanentlyDeleteOrderFromHistory, loadOrder, drafts, deleteDraft, loadDraft, pushView, appLanguage, updateSpecificHistoryItem, updateOrderHistoryState, addToOfflineQueue, syncOfflineQueue, deletedOrderIds, historyDeliveryFilter, setHistoryDeliveryFilter, historyPendingTimeFilter, setHistoryPendingTimeFilter, historyRef, deletedOrderIdsRef, currentTime, setCurrentTime, confirmAction, setConfirmAction, isConfirmLoading, setIsConfirmLoading, alertMsg, setAlertMsg, syncErrorToast, setSyncErrorToast, refreshing, setRefreshing, pullProgress, setPullProgress, startY, setStartY, isPulling, setIsPulling, syncingId, setSyncingId, deliveryFilter, setDeliveryFilter, pendingTimeFilter, setPendingTimeFilter, activeTab, setActiveTab, searchQuery, setSearchQuery, remoteResults, setRemoteResults, isSearching, setIsSearching, searchError, setSearchError, showDbSettings, setShowDbSettings, globalScriptUrl, setGlobalScriptUrl, annualSheets, setAnnualSheets };
}
