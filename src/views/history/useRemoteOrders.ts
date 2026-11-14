import React from 'react';
import { AppState, INITIAL_STATE } from '../../types';
import { DEFAULT_SCRIPT_URL, withScriptKey } from '../../config';
import { parseDueTimestamp } from './helpers';
import { useHistoryState } from './useHistoryState';
import { useHistoryDerived } from './useHistoryDerived';
import { useCloudSync } from './useCloudSync';
import { usePullToRefresh } from './usePullToRefresh';

export function useRemoteOrders(deps: ReturnType<typeof useHistoryState> & ReturnType<typeof useHistoryDerived> & ReturnType<typeof useCloudSync> & ReturnType<typeof usePullToRefresh>) {
  const { addToOfflineQueue, annualSheets, appLanguage, clearHistory, deletedOrderIds, getActiveScriptUrl, history, jsonpRequest, loadOrder, searchQuery, setAlertMsg, setConfirmAction, setIsSearching, setRemoteResults, setSearchError, setShowDbSettings, state, updateSpecificHistoryItem } = deps;


  const handleClearConfirm = () => {
    setConfirmAction({
      title: appLanguage === 'ms' ? 'Padam Semua Sejarah?' : 'Delete All History?',
      message: appLanguage === 'ms'
        ? 'Tindakan ini tidak boleh diundurkan. Semua rekod tempahan akan dipadam.'
        : 'This action cannot be undone. All order records will be deleted.',
      onConfirm: () => {
        clearHistory();
        setConfirmAction(null);
      }
    });
  };

  const handleRemoteSearch = async () => {
    const activeConfigs = annualSheets.filter(s => s.spreadsheetId.trim() !== '');

    if (activeConfigs.length === 0) {
      setAlertMsg({
        type: 'error',
        message: appLanguage === 'ms'
          ? 'Sila tetapkan sekurang-kurangnya satu Spreadsheet ID/Pautan di dalam Tetapan sebelum mencari.'
          : 'Please set at least one Spreadsheet ID/Link in settings before searching.'
      });
      setShowDbSettings(true);
      return;
    }

    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    setSearchError('');
    setRemoteResults([]);

    const allMatchedOrders: any[] = [];
    const errors: string[] = [];

    const extractId = (input: string) => {
      const trimmed = input.trim();
      if (trimmed.includes('docs.google.com/spreadsheets/d/')) {
        const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
        return match ? match[1] : trimmed;
      }
      return trimmed;
    };

    try {
      await Promise.all(
        activeConfigs.map(async (sheet) => {
          try {
            const sId = extractId(sheet.spreadsheetId);
            const sUrl = sheet.scriptUrl.trim() || DEFAULT_SCRIPT_URL;

            const callbackName = 'jsonp_callback_db_search_' + Math.round(100000 * Math.random()) + '_' + sheet.year;
            const url = new URL(sUrl);

            url.searchParams.append('action', 'search_database');
            url.searchParams.append('spreadsheetId', sId);
            url.searchParams.append('query', q);
            url.searchParams.append('callback', callbackName);

            const data = await jsonpRequest(url, callbackName);

            if (data.status === 'success' && Array.isArray(data.orders)) {
              const annotated = data.orders.map((o: any) => {
                const genId = o.orderId || `SYNC-${o.name || 'UNKNOWN'}-${o.phone || ''}-${o.due || ''}`
                   .replace(/\s+/g, '-')
                   .replace(/[^a-zA-Z0-9-]/g, '');
                return {
                  ...o,
                  generatedId: genId,
                  sheetName: sheet.year,
                  spreadsheetId: sId,
                  scriptUrl: sUrl
                };
              }).filter((o: any) => {
                return !deletedOrderIds.includes(o.generatedId) && !deletedOrderIds.includes(o.orderId);
              });
              allMatchedOrders.push(...annotated);
            } else {
              errors.push(`${sheet.year}: ${data.message || 'Error'}`);
            }
          } catch (err: any) {
            errors.push(`${sheet.year}: ${err.message || String(err)}`);
          }
        })
      );

      setRemoteResults(allMatchedOrders);

      if (allMatchedOrders.length === 0) {
        if (errors.length > 0) {
          setSearchError(
            appLanguage === 'ms'
              ? `Carian ralat:\n${errors.join('\n')}`
              : `Search errors:\n${errors.join('\n')}`
          );
        } else {
          setSearchError(
            appLanguage === 'ms'
              ? 'Tiada padanan dijumpai di Google Sheets tahunan.'
              : 'No matching records found across the annual Google Sheets.'
          );
        }
      } else if (errors.length > 0) {
        console.warn('Some sheet searches failed:', errors);
      }
    } catch (err: any) {
      setSearchError(appLanguage === 'ms' ? 'Carian gagal: ' + String(err) : 'Search failed: ' + String(err));
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadRemoteOrder = (orderData: any) => {
    const generatedOrderId =
      orderData.orderId ||
      `SYNC-${orderData.name || 'UNKNOWN'}-${orderData.phone || ''}-${orderData.due || ''}`
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '');

    // Check if we already have this in local history (by generatedOrderId or orderId) to avoid creating a duplicate card
    const localMatch = history.find(item => 
      item.id === generatedOrderId || 
      (item.state?.orderId && item.state.orderId === generatedOrderId)
    );

    if (localMatch) {
      loadOrder(localMatch);
      return;
    }

    const dueTs = parseDueTimestamp(orderData.due);

    const stateToApply: AppState = {
      ...INITIAL_STATE,
      isDelivered: !!orderData.isDelivered,
      spreadsheetId: orderData.spreadsheetId || state.spreadsheetId,
      customerName: orderData.name,
      customerPhone: orderData.phone,
      customerOrder: orderData.order,
      template: orderData.template,
      customerTemplate: orderData.template,
      customerBahasa: orderData.bahasa,
      customerAddOn: orderData.addon,
      customerJenis: orderData.jenis,
      customerDue: orderData.due,
      orderLink: orderData.link,
      googleSheetLink: orderData.link,
      orderId: generatedOrderId,
      dueTimestamp: dueTs,
      mainType:
        orderData.order === 'Resume'
          ? 'Resume'
          : orderData.order === 'Surat'
          ? 'Surat'
          : orderData.order || 'Lain-lain',
      subType: '',
      customerInfo: ''
    };

    const mockHistoryItem = {
      id: generatedOrderId,
      timestamp: Date.now(),
      state: stateToApply,
      messages: []
    };

    loadOrder(mockHistoryItem);
  };

  const performRemoteDeliveredToggle = async (
    index: number,
    orderData: any,
    isRetry = false
  ) => {
    const spreadsheetId = orderData.spreadsheetId || state.spreadsheetId;
    const scriptUrl = orderData.scriptUrl || getActiveScriptUrl(spreadsheetId);
    const orderId = orderData.orderId;
    const currentStatus = !!orderData.isDelivered;
    const newStatus = isRetry ? currentStatus : !currentStatus;

    if (!spreadsheetId || !orderId) {
      setAlertMsg({ type: 'error', message: appLanguage === 'ms' ? 'Kekurangan Order ID atau Spreadsheet ID.' : 'Missing Order ID or Spreadsheet ID.' });
      return;
    }

    // Instantly update local UI
    const now = Date.now();
    setRemoteResults((prev) =>
      prev.map((item, idx) => (idx === index ? { 
        ...item, 
        isDelivered: newStatus,
        syncStatus: 'syncing',
        syncLastAttempt: now
      } : item))
    );

    // If it exists in local history too, update there
    const existingIdx = history.findIndex((h) => h.state?.orderId === orderId);
    if (existingIdx !== -1) {
      updateSpecificHistoryItem(history[existingIdx].id, {
        isDelivered: newStatus,
        syncStatus: 'syncing',
        syncLastAttempt: now
      });
    }

    try {
      const callbackName = 'jsonp_callback_remote_delivered_' + Math.round(Math.random() * 100000);
      const url = new URL(scriptUrl);

      url.searchParams.append('action', 'update_delivered');
      url.searchParams.append('spreadsheetId', spreadsheetId);
      url.searchParams.append('orderId', orderId);
      url.searchParams.append('isDelivered', String(newStatus));
      url.searchParams.append('callback', callbackName);

      const result = await jsonpRequest(url, callbackName);
      if (result.status !== 'success') {
        console.warn('Synced status check warning:', result.message || 'Update failed');
          // Try POST fallback
          console.log("Executing no-cors POST update_delivered fallback from remote...");
          fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(withScriptKey({
              action: 'update_delivered',
              spreadsheetId: spreadsheetId,
              orderId: orderId,
              isDelivered: newStatus
            }))
          }).then(() => {
  console.log(
    'no-cors POST sent, but server response could not be verified.'
  );

  setRemoteResults((prev) =>
    prev.map((item, idx) =>
      idx === index
        ? {
            ...item,
            syncStatus: 'sent_unverified',
            syncLastAttempt: Date.now()
          }
        : item
    )
  );

  if (existingIdx !== -1) {
    updateSpecificHistoryItem(history[existingIdx].id, {
      syncStatus: 'sent_unverified',
      syncLastAttempt: Date.now()
    });
  }
          }).catch((postErr) => {
             console.error("POST delivered status fallback failed, queuing for offline:", postErr);
             addToOfflineQueue({
               action: 'update_delivered',
               spreadsheetId: spreadsheetId,
               orderId: orderId,
               isDelivered: newStatus
             }, scriptUrl, existingIdx !== -1 ? history[existingIdx].id : undefined);

             setRemoteResults((prev) =>
              prev.map((item, idx) => (idx === index ? { 
                ...item, 
                syncStatus: 'failed',
                syncFailCount: (item.syncFailCount || 0) + 1,
                syncLastAttempt: Date.now()
              } : item))
            );
            if (existingIdx !== -1) {
              updateSpecificHistoryItem(history[existingIdx].id, {
                syncStatus: 'failed',
                syncFailCount: (history[existingIdx].state?.syncFailCount || 0) + 1,
                syncLastAttempt: Date.now()
              });
            }
          });
      } else {
         setRemoteResults((prev) =>
          prev.map((item, idx) => (idx === index ? { 
            ...item, 
            syncStatus: 'synced',
            syncLastSuccess: Date.now(),
            syncFailCount: 0
          } : item))
        );
        if (existingIdx !== -1) {
           updateSpecificHistoryItem(history[existingIdx].id, {
             syncStatus: 'synced',
             syncLastSuccess: Date.now(),
             syncFailCount: 0
           });
        }
      }
    } catch (err) {
      console.warn('Failed to sync delivered status update in background:', err);
      // Try POST fallback
      console.log("Executing no-cors POST update_delivered fallback from remote catch...");
      fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(withScriptKey({
          action: 'update_delivered',
          spreadsheetId: spreadsheetId,
          orderId: orderId,
          isDelivered: newStatus
        }))
      }).then(() => {
  console.log(
    'no-cors POST sent, but server response could not be verified.'
  );

  setRemoteResults((prev) =>
    prev.map((item, idx) =>
      idx === index
        ? {
            ...item,
            syncStatus: 'sent_unverified',
            syncLastAttempt: Date.now()
          }
        : item
    )
  );

  if (existingIdx !== -1) {
    updateSpecificHistoryItem(history[existingIdx].id, {
      syncStatus: 'sent_unverified',
      syncLastAttempt: Date.now()
    });
  }
}).catch((postErr) => {
         console.error("POST delivered status fallback failed, queuing for offline:", postErr);
         addToOfflineQueue({
           action: 'update_delivered',
           spreadsheetId: spreadsheetId,
           orderId: orderId,
           isDelivered: newStatus
         }, scriptUrl, existingIdx !== -1 ? history[existingIdx].id : undefined);

         setRemoteResults((prev) =>
          prev.map((item, idx) => (idx === index ? { 
            ...item, 
            syncStatus: 'failed',
            syncFailCount: (item.syncFailCount || 0) + 1,
            syncLastAttempt: Date.now()
          } : item))
        );
        if (existingIdx !== -1) {
          updateSpecificHistoryItem(history[existingIdx].id, {
            syncStatus: 'failed',
            syncFailCount: (history[existingIdx].state?.syncFailCount || 0) + 1,
            syncLastAttempt: Date.now()
          });
        }
      });
    }
  };

  const handleRemoteDeliveredToggle = async (
    e: React.MouseEvent,
    index: number,
    orderData: any,
    isRetry = false
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const currentStatus = !!orderData.isDelivered;

    // If marking as delivered (pending -> delivered) and not a retry, ask confirmation first
    if (!currentStatus && !isRetry) {
      const custName = orderData.customerName ? ` (${orderData.customerName})` : '';
      setConfirmAction({
        title: appLanguage === 'ms' ? 'Dah siap hantar ke?' : 'Order delivered already?',
        message: appLanguage === 'ms'
          ? `Order${custName} dah selamat sampai kat customer? Nak mark sebagai dah settle?`
          : `Did order${custName} safely reach the customer? Mark as all done?`,
        confirmText: appLanguage === 'ms' ? 'Dah Siap!' : 'Yep, All Done!',
        cancelText: appLanguage === 'ms' ? 'Belum Lagi' : 'Not Yet',
        isDestructive: false,
        onConfirm: async () => {
          setConfirmAction(null);
          await performRemoteDeliveredToggle(index, orderData, isRetry);
        }
      });
      return;
    }

    await performRemoteDeliveredToggle(index, orderData, isRetry);
  };

  return { handleClearConfirm, handleRemoteSearch, handleLoadRemoteOrder, performRemoteDeliveredToggle, handleRemoteDeliveredToggle };
}
