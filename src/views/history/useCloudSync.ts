import React, { useEffect } from 'react';
import { AppState, INITIAL_STATE } from '../../types';
import { normalizeNameStr, normalizePhoneDigits, parseMainType, deduplicateHistoryList, extractPendapatanValue, smartFetchGoogleScript } from '../../utils';
import { DEFAULT_SCRIPT_URL, withScriptKey } from '../../config';
import { parseDueTimestamp } from './helpers';
import { useHistoryState } from './useHistoryState';
import { useHistoryDerived } from './useHistoryDerived';

export function useCloudSync(deps: ReturnType<typeof useHistoryState> & ReturnType<typeof useHistoryDerived>) {
  const { addToOfflineQueue, annualSheets, appLanguage, deletedOrderIdsRef, globalScriptUrl, setAlertMsg, setConfirmAction, setHistory, setPullProgress, setRefreshing, setSyncErrorToast, setSyncingId, state, syncOfflineQueue, updateSpecificHistoryItem } = deps;


  const extractId = (input: string) => {
    const trimmed = input.trim();
    if (trimmed.includes('docs.google.com/spreadsheets/d/')) {
      const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
      return match ? match[1] : trimmed;
    }
    return trimmed;
  };

  const getActiveScriptUrl = (sId?: string) => {
    if (globalScriptUrl && globalScriptUrl.trim() !== '') {
      return globalScriptUrl.trim();
    }
    if (sId) {
      const targetId = extractId(sId);
      const found = annualSheets.find((s: any) => extractId(s.spreadsheetId) === targetId);
      if (found && found.scriptUrl && found.scriptUrl.trim() !== '') {
        return found.scriptUrl.trim();
      }
    }
    const firstActive = annualSheets.find((s: any) => s.scriptUrl && s.scriptUrl.trim() !== '');
    if (firstActive) {
      return firstActive.scriptUrl.trim();
    }
    return DEFAULT_SCRIPT_URL;
  };

  const jsonpRequest = (url: URL, callbackName: string) => {
    return smartFetchGoogleScript(url, callbackName);
  };

  const handleSyncLink = async (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();

    const spreadsheetId = item.state?.spreadsheetId || state.spreadsheetId;

    if (!item.state?.orderId || !spreadsheetId) {
      setAlertMsg({ type: 'error', message: appLanguage === 'ms' ? 'Kekurangan Order ID atau Spreadsheet ID.' : 'Missing Order ID or Spreadsheet ID.' });
      return;
    }

    setSyncingId(item.id);

    try {
      const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
      const url = new URL(getActiveScriptUrl(spreadsheetId));

      url.searchParams.append('action', 'get_link');
      url.searchParams.append('orderId', item.state.orderId);
      url.searchParams.append('spreadsheetId', spreadsheetId);
      url.searchParams.append('callback', callbackName);

      const data = await jsonpRequest(url, callbackName);

      if (data.status === 'success' && data.link) {
        updateSpecificHistoryItem(item.id, {
          googleSheetLink: data.link,
          spreadsheetId
        });
        setAlertMsg({ type: 'success', message: appLanguage === 'ms' ? 'Pautan berjaya dikemaskini!' : 'Link successfully updated!' });
      } else if (data.status === 'success') {
        setAlertMsg({ type: 'info', message: appLanguage === 'ms' ? 'Tiada pautan dijumpai dalam rekod Google Sheet.' : 'No link found in the Google Sheet record.' });
      } else {
        setAlertMsg({ type: 'error', message: 'Error: ' + (data.message || 'Unknown error') });
      }
    } catch (err) {
      setAlertMsg({ type: 'error', message: 'Failed to sync link: ' + String(err) });
    } finally {
      setSyncingId(null);
    }
  };

  const performDeliveredToggle = async (
    item: any,
    currentStatus: boolean,
    isRetry = false
  ) => {
    const spreadsheetId = item.state?.spreadsheetId || state.spreadsheetId;
    const orderId = item.state?.orderId;
    const newStatus = isRetry ? currentStatus : !currentStatus;
    const now = Date.now();

    // 1. Instantly update local state for perfect responsiveness and offline action
    updateSpecificHistoryItem(item.id, {
      isDelivered: newStatus,
      hasNotified: false,
      ...(spreadsheetId ? { spreadsheetId } : {}),
      ...(spreadsheetId && orderId ? {
        syncStatus: 'syncing',
        syncLastAttempt: now,
      } : {
        syncStatus: 'saved_locally'
      }),
    });

    // 2. If spreadsheetId and orderId are configured, gently sync update with Google Sheets in background
    if (spreadsheetId && orderId) {
      const activeUrl = getActiveScriptUrl(spreadsheetId);
      const callbackName = 'jsonp_callback_delivered_' + Math.round(Math.random() * 100000);
      const url = new URL(activeUrl);

      url.searchParams.append('action', 'update_delivered');
      url.searchParams.append('spreadsheetId', spreadsheetId);
      url.searchParams.append('orderId', orderId);
      url.searchParams.append('isDelivered', String(newStatus));
      url.searchParams.append('callback', callbackName);

      const triggerPostFallback = () => {
        console.log("Executing no-cors POST update_delivered fallback...");
        fetch(activeUrl, {
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

  updateSpecificHistoryItem(item.id, {
    syncStatus: 'sent_unverified',
    syncLastAttempt: Date.now(),
  });
        }).catch(postErr => {
          console.error("POST delivered status fallback failed, queuing for offline:", postErr);
          addToOfflineQueue({
            action: 'update_delivered',
            spreadsheetId: spreadsheetId,
            orderId: orderId,
            isDelivered: newStatus
          }, activeUrl, item.id);
          updateSpecificHistoryItem(item.id, {
            syncStatus: 'failed',
            syncFailCount: (item.state?.syncFailCount || 0) + 1,
            syncLastAttempt: Date.now(),
          });
        });
      };

      try {
        const result = await jsonpRequest(url, callbackName);
        if (!result || result.status !== 'success') {
          console.warn('Synced status check warning, trying POST fallback:', result?.message || 'Update failed');
          triggerPostFallback();
        } else {
          updateSpecificHistoryItem(item.id, {
             syncStatus: 'synced',
             syncLastSuccess: Date.now(),
             syncFailCount: 0,
          });
          handleGlobalSync(true);
        }
      } catch (err) {
        console.warn('Failed to sync delivered status update in background, running POST fallback:', err);
        triggerPostFallback();
      }
    }
  };

  const handleDeliveredToggle = async (
    e: React.MouseEvent,
    item: any,
    currentStatus: boolean,
    isRetry = false
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // If marking as delivered (pending -> delivered) and not a retry, ask confirmation first
    if (!currentStatus && !isRetry) {
      const custName = item.state?.customerName ? ` (${item.state.customerName})` : '';
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
          await performDeliveredToggle(item, currentStatus, isRetry);
        }
      });
      return;
    }

    await performDeliveredToggle(item, currentStatus, isRetry);
  };

  const deleteOrderFromCloud = async (spreadsheetId: string, orderId: string) => {
    if (spreadsheetId && orderId) {
      const activeUrl = getActiveScriptUrl(spreadsheetId);
      const callbackName = 'jsonp_callback_delete_' + Math.round(Math.random() * 100000);
      const url = new URL(activeUrl);

      url.searchParams.append('action', 'delete_order');
      url.searchParams.append('spreadsheetId', spreadsheetId);
      url.searchParams.append('orderId', orderId);
      url.searchParams.append('callback', callbackName);

      const triggerPostFallback = async () => {
        console.log("Executing no-cors POST delete_order fallback...");
        try {
          await fetch(activeUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(withScriptKey({
              action: 'delete_order',
              spreadsheetId: spreadsheetId,
              orderId: orderId
            }))
          });
          console.log("no-cors POST delete fallback succeeded!");
        } catch (postErr) {
          console.error("POST delete fallback failed, queuing for offline:", postErr);
          addToOfflineQueue({
            action: 'delete_order',
            spreadsheetId: spreadsheetId,
            orderId: orderId
          }, activeUrl);
        }
      };

      try {
        const resp = await jsonpRequest(url, callbackName);
        if (resp && resp.status === 'success') {
          console.log('Successfully deleted order from cloud:', resp);
        } else {
          console.warn('JSONP deletion failed, attempting POST fallback:', resp);
          await triggerPostFallback();
        }
      } catch (err) {
        console.warn('Failed to delete order from cloud via JSONP, running fallback:', err);
        await triggerPostFallback();
      }
    }
  };

  const handleGlobalSync = async (silent = false) => {
    // Collect all active annual sheets
    const activeConfigs = annualSheets.filter(
      sheet => sheet.spreadsheetId && sheet.spreadsheetId.trim() !== ''
    );

    if (activeConfigs.length === 0) {
      if (!silent) {
        setAlertMsg({
          type: 'error',
          message: appLanguage === 'ms'
            ? 'Sila konfigurasikan sekurang-kurangnya satu spreadsheet ID di bahagian Tetapan Database terlebih dahulu.'
            : 'Please configure at least one spreadsheet ID in Database Settings first.'
        });
      }
      return;
    }

    setRefreshing(true);
    setSyncErrorToast(null);

    // Wait for offline queue to attempt to clear before pulling results
    await syncOfflineQueue();

    try {
      const currentNow = Date.now();
      let totalNewCou = 0;
      let totalUpdCou = 0;

      // Perform JSONP sync_recent requests across all active yearly sheets
      const fetchPromises = activeConfigs.map(async (sheet) => {
        const rawId = sheet.spreadsheetId.trim();
        const sId = extractId(rawId);
        const sUrl = sheet.scriptUrl.trim() || DEFAULT_SCRIPT_URL;

        const safeYear = String(sheet.year).replace(/[^\w]/g, '_');
        const callbackName = 'jsonp_callback_sync_' + Math.round(100000 * Math.random()) + '_' + safeYear;
        const url = new URL(sUrl);

        url.searchParams.append('action', 'sync_recent');
        url.searchParams.append('spreadsheetId', sId);
        url.searchParams.append('callback', callbackName);

        try {
          const data = await jsonpRequest(url, callbackName);
          if (data && data.status === 'success' && Array.isArray(data.orders)) {
            return { year: sheet.year, orders: data.orders, spreadsheetId: sId, success: true };
          }
          return { year: sheet.year, orders: [], spreadsheetId: sId, success: false, error: data?.message || 'Invalid format' };
        } catch (e) {
          console.warn(`Sync failed for year ${sheet.year}:`, e);
          return { year: sheet.year, orders: [], spreadsheetId: sId, success: false, error: String(e) };
        }
      });

      const results = await Promise.all(fetchPromises);

      setHistory(prevHistory => {
        let updatedHistory = [...prevHistory];

        for (const res of results) {
          if (!res.success) continue;



          for (const orderData of res.orders) {
            const generatedOrderId =
              orderData.orderId ||
              `SYNC-${orderData.name || 'UNKNOWN'}-${orderData.phone || ''}-${orderData.due || ''}`
                .replace(/\s+/g, '-')
                .replace(/[^a-zA-Z0-9-]/g, '');

            // Use the up-to-date deletedOrderIds ref to skip any deleted items
            if (deletedOrderIdsRef.current.includes(generatedOrderId)) {
              continue;
            }

            const normSheetName = normalizeNameStr(orderData.name);
            const normSheetPhone = normalizePhoneDigits(orderData.phone);
            const normSheetOrderId = String(orderData.orderId || '').trim();

            const existingIdx = updatedHistory.findIndex(h => {
              const hOrderId = String(h.state?.orderId || '').trim();
              const hId = String(h.id || '').trim();

              // 1. Direct Order ID match
              if (
                (generatedOrderId && (hOrderId === generatedOrderId || hId === generatedOrderId)) ||
                (normSheetOrderId && (hOrderId === normSheetOrderId || hId === normSheetOrderId))
              ) {
                return true;
              }

              // 2. Match by Name + Phone (if phone digits exist)
              if (normSheetName && normSheetPhone) {
                const hName = normalizeNameStr(h.state?.customerName || h.state?.name);
                const hPhone = normalizePhoneDigits(h.state?.customerPhone || h.state?.phone);
                if (hName === normSheetName && hPhone === normSheetPhone) {
                  return true;
                }
              }

              // 3. Match by Name + Order type
              if (normSheetName) {
                const hName = normalizeNameStr(h.state?.customerName || h.state?.name);
                if (hName === normSheetName) {
                  const hOrder = String(h.state?.customerOrder || h.state?.mainType || '').trim().toLowerCase();
                  const sheetOrder = String(orderData.order || '').trim().toLowerCase();
                  if (!hOrder || !sheetOrder || hOrder === sheetOrder) {
                    return true;
                  }
                }
              }

              return false;
            });

            const dueTs = parseDueTimestamp(orderData.due);

            let parsedName = orderData.name ? String(orderData.name).trim() : '';
            parsedName = parsedName.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
            
            let parsedTemplate = orderData.template ? String(orderData.template).trim().toUpperCase() : '';

            const parsedType = parseMainType(orderData.order);
            const parsedPrice = extractPendapatanValue(orderData);

            const newState = {
              isDelivered: !!orderData.isDelivered,
              spreadsheetId: res.spreadsheetId,
              customerName: parsedName,
              customerPhone: orderData.phone,
              customerOrder: orderData.order || parsedType,
              template: parsedTemplate,
              customerTemplate: parsedTemplate,
              customerBahasa: orderData.bahasa,
              customerAddOn: orderData.addon,
              customerJenis: orderData.jenis,
              customerDue: orderData.due,
              orderLink: orderData.link,
              googleSheetLink: orderData.link,
              orderId: generatedOrderId,
              dueTimestamp: dueTs,
              syncStatus: 'synced' as const,
              syncLastSuccess: currentNow,
              mainType: parsedType,
              subType: '',
              itemPrice: parsedPrice,
              price: parsedPrice,
              harga: parsedPrice,
              bayaran: parsedPrice
            };

            if (existingIdx !== -1) {
              const existingItem = updatedHistory[existingIdx];

              if (existingItem.state?.isDeleted) {
                const activeSheet = annualSheets.find(s => s.spreadsheetId === res.spreadsheetId);
                if (activeSheet) {
                  addToOfflineQueue({
                    action: 'delete_order',
                    spreadsheetId: res.spreadsheetId,
                    orderId: generatedOrderId
                  }, activeSheet.scriptUrl);
                }
                continue;
              }

              const localState: Partial<AppState> = existingItem.state || {};

              const hasDiff =
                String(localState.orderId || '') !== generatedOrderId ||
                !!localState.isDelivered !== !!newState.isDelivered ||
                String(localState.customerName || '').trim() !== String(newState.customerName || '').trim() ||
                String(localState.customerPhone || '').trim() !== String(newState.customerPhone || '').trim() ||
                String(localState.customerOrder || '').trim() !== String(newState.customerOrder || '').trim() ||
                String(localState.customerTemplate || '').trim() !== String(newState.customerTemplate || '').trim() ||
                String(localState.customerBahasa || '').trim() !== String(newState.customerBahasa || '').trim() ||
                String(localState.customerAddOn || '').trim() !== String(newState.customerAddOn || '').trim() ||
                String(localState.customerJenis || '').trim() !== String(newState.customerJenis || '').trim() ||
                String(localState.customerDue || '').trim() !== String(newState.customerDue || '').trim() ||
                String(localState.orderLink || '').trim() !== String(newState.orderLink || '').trim() ||
                localState.syncStatus !== 'synced';

              if (hasDiff) {
                const recentlyToggledOrEdited =
                  localState.lastModifiedLocally &&
                  currentNow - localState.lastModifiedLocally < 15000;

                if (!recentlyToggledOrEdited) {
                  const finalLink = (orderData.link || '').trim() || localState.orderLink || localState.googleSheetLink || '';
                  updatedHistory[existingIdx] = {
                    ...existingItem,
                    id: String(existingItem.id || '').startsWith('SYNC-')
                      ? generatedOrderId
                      : existingItem.id,
                    state: {
                      ...INITIAL_STATE,
                      ...localState,
                      ...newState,
                      orderLink: finalLink,
                      googleSheetLink: finalLink,
                      orderId: generatedOrderId,
                      syncStatus: 'synced'
                    }
                  };

                  totalUpdCou++;
                }
              }
} else {
  updatedHistory.push({
    id: generatedOrderId,
    timestamp: currentNow,
    state: {
      ...INITIAL_STATE,
      ...newState
    },
    messages: []
  });

  totalNewCou++;
}
          }
        }

        return deduplicateHistoryList(updatedHistory);
      });

      localStorage.setItem('db_last_sync_time', String(currentNow));
      console.log(`[Sync Debug] Manual sync finished at ${new Date(currentNow).toISOString()}`, {
        successfulSheets: results.filter(r => r.success).length,
        failedSheets: results.filter(r => !r.success).length,
        totalOrdersReceived: results.reduce((sum, r) => sum + (r.orders?.length || 0), 0),
        newLastSyncTimestamp: new Date(currentNow).toISOString()
      });

      const failed = results.filter(r => !r.success);

      if (failed.length > 0) {
        if (!silent) {
          const failedYears = failed.map(f => f.year || 'UNKNOWN').join(', ');
          setSyncErrorToast({
            message: appLanguage === 'ms'
              ? `Gagal menyelaraskan database bagi tahun: ${failedYears}`
              : `Failed to sync database for years: ${failedYears}`,
            visible: true
          });
        }
      } else {
        if (!silent) {
          setAlertMsg({
            type: 'success',
            message: appLanguage === 'ms'
              ? `Berjaya dikemaskini daripada ${activeConfigs.length} database tahunan!\nBaru: ${totalNewCou}\nDikemaskini: ${totalUpdCou}`
              : `Aggregated sync complete across ${activeConfigs.length} annual sheets!\nNew: ${totalNewCou}\nUpdated: ${totalUpdCou}`
          });
        }
      }
    } catch (e) {
      if (!silent) {
        setSyncErrorToast({
          message: appLanguage === 'ms'
            ? 'Penyelarasan gagal: ' + String(e)
            : 'Sync failed: ' + String(e),
          visible: true
        });
      }
    } finally {
      setRefreshing(false);
      setPullProgress(0);
    }
  };

  useEffect(() => {
    if (navigator.onLine) {
      handleGlobalSync(true);
    }

    const interval = setInterval(() => {
      if (navigator.onLine) {
        handleGlobalSync(true);
      }
    }, 30000);

    const handleFocus = () => {
      if (navigator.onLine) {
        handleGlobalSync(true);
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return { extractId, getActiveScriptUrl, jsonpRequest, handleSyncLink, performDeliveredToggle, handleDeliveredToggle, deleteOrderFromCloud, handleGlobalSync };
}
