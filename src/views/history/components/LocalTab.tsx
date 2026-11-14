import React from 'react';
import { cn } from '../../../cn';
import { Clock, Trash2, Calendar, AlertCircle, RefreshCcw, Bell, Check, Phone } from 'lucide-react';
import { getWhatsAppLink, parsePhoneAndUsername, extractPendapatanValue } from '../../../utils';
import { getOrderDueTimestamp } from '../../../utils/orderWindow';
import type { HistoryController } from '../useHistoryController';
import { formatCustomerName, formatDisplayPhone, getRelativeDayDetails } from '../helpers';

export function LocalTab({ c }: { c: HistoryController }) {
  const { appLanguage, currentTime, deleteOrderFromCloud, deleteOrderFromHistory, deliveryFilter, handleDeliveredToggle, handleGlobalSync, handleSyncLink, history, loadOrder, localizedHistoryItems, pendingStats, pendingTimeFilter, refreshing, setConfirmAction, setCurrentTime, setDeliveryFilter, setPendingTimeFilter, state, syncingId } = c;
  return (
    <div className="space-y-4">
            {history.filter(item => !item.state?.isDeleted).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-subtext space-y-4">
                <Clock className="w-16 h-16 opacity-50" />
                <p className="font-bold">
                  {appLanguage === 'ms' ? 'Tiada sejarah tempahan' : 'No order history'}
                </p>
                <button
                  type="button"
                  onClick={() => handleGlobalSync(false)}
                  disabled={refreshing}
                  className="inline-flex items-center text-xs font-semibold px-4 py-2 rounded-xl bg-gray-100 text-subtext border border-transparent hover:bg-gray-200 active:scale-95 transition-all duration-200"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                  {appLanguage === 'ms' ? 'Sync dari Google Sheet' : 'Sync from Google Sheet'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* No local search input here anymore, moved to top */}

            <div className="flex bg-gray-100 p-1 rounded-xl">
              {(['all', 'pending', 'delivered'] as const).map((filterOpt) => {
                const isActive = deliveryFilter === filterOpt;
                let label = '';
                if (filterOpt === 'all') {
                  label = appLanguage === 'ms' ? 'Semua' : 'All';
                } else if (filterOpt === 'pending') {
                  label = appLanguage === 'ms' ? 'Pending' : 'Pending';
                } else if (filterOpt === 'delivered') {
                  label = appLanguage === 'ms' ? 'Dihantar' : 'Delivered';
                }

                return (
                  <button
                    key={filterOpt}
                    type="button"
                    onClick={() => setDeliveryFilter(filterOpt)}
                    className={`flex-1 text-center text-xs font-bold py-2 px-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-subtext/70 hover:text-text hover:bg-white/40'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {deliveryFilter !== 'delivered' && (
              <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryFilter('pending');
                    setCurrentTime(Date.now());
                    setPendingTimeFilter(pendingTimeFilter === 'today' ? 'all' : 'today');
                  }}
                  className={cn(
                    "flex-1 border rounded-xl p-1.5 flex flex-col items-center justify-center transition-all active:scale-95 duration-150 min-w-0 outline-none",
                    pendingTimeFilter === 'today' && deliveryFilter === 'pending'
                      ? "bg-rose-500 text-white border-rose-600 shadow-sm"
                      : "bg-rose-50/50 border-rose-100 hover:bg-rose-50/80 dark:border-gray-800"
                  )}
                >
                  <span className={cn("text-[10px] font-black uppercase tracking-tighter truncate w-full text-center leading-none", pendingTimeFilter === 'today' && deliveryFilter === 'pending' ? "text-white/80" : "text-rose-600")}>
                    {appLanguage === 'ms' ? 'Hari Ini' : 'Today'}
                  </span>
                  <span className={cn("text-base font-black leading-none mt-1 sm:mt-1.5", pendingTimeFilter === 'today' && deliveryFilter === 'pending' ? "text-white" : "text-rose-700")}>{pendingStats.today}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryFilter('pending');
                    setCurrentTime(Date.now());
                    setPendingTimeFilter(pendingTimeFilter === 'tomorrow' ? 'all' : 'tomorrow');
                  }}
                  className={cn(
                    "flex-1 border rounded-xl p-1.5 flex flex-col items-center justify-center transition-all active:scale-95 duration-150 min-w-0 outline-none",
                    pendingTimeFilter === 'tomorrow' && deliveryFilter === 'pending'
                      ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                      : "bg-amber-50/50 border-amber-100 hover:bg-amber-50/80 dark:border-gray-800"
                  )}
                >
                  <span className={cn("text-[10px] font-black uppercase tracking-tighter truncate w-full text-center leading-none", pendingTimeFilter === 'tomorrow' && deliveryFilter === 'pending' ? "text-white/80" : "text-amber-600")}>
                    {appLanguage === 'ms' ? 'Esok' : 'Tomorrow'}
                  </span>
                  <span className={cn("text-base font-black leading-none mt-1 sm:mt-1.5", pendingTimeFilter === 'tomorrow' && deliveryFilter === 'pending' ? "text-white" : "text-amber-700")}>{pendingStats.tomorrow}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryFilter('pending');
                    setCurrentTime(Date.now());
                    setPendingTimeFilter(pendingTimeFilter === '2days' ? 'all' : '2days');
                  }}
                  className={cn(
                    "flex-1 border rounded-xl p-1.5 flex flex-col items-center justify-center transition-all active:scale-95 duration-150 min-w-0 outline-none",
                    pendingTimeFilter === '2days' && deliveryFilter === 'pending'
                      ? "bg-indigo-500 text-white border-indigo-600 shadow-sm"
                      : "bg-indigo-50/50 border-indigo-100 hover:bg-indigo-50/80 dark:border-gray-800"
                  )}
                >
                  <span className={cn("text-[10px] font-black uppercase tracking-tighter truncate w-full text-center leading-none", pendingTimeFilter === '2days' && deliveryFilter === 'pending' ? "text-white/80" : "text-indigo-600")}>
                    {appLanguage === 'ms' ? '2 Hari' : '2 Days'}
                  </span>
                  <span className={cn("text-base font-black leading-none mt-1 sm:mt-1.5", pendingTimeFilter === '2days' && deliveryFilter === 'pending' ? "text-white" : "text-indigo-700")}>{pendingStats.day2}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryFilter('pending');
                    setCurrentTime(Date.now());
                    setPendingTimeFilter(pendingTimeFilter === '3days' ? 'all' : '3days');
                  }}
                  className={cn(
                    "flex-1 border rounded-xl p-1.5 flex flex-col items-center justify-center transition-all active:scale-95 duration-150 min-w-0 outline-none",
                    pendingTimeFilter === '3days' && deliveryFilter === 'pending'
                      ? "bg-blue-500 text-white border-blue-600 shadow-sm"
                      : "bg-blue-50/50 border-blue-100 hover:bg-blue-50/80 dark:border-gray-800"
                  )}
                >
                  <span className={cn("text-[10px] font-black uppercase tracking-tighter truncate w-full text-center leading-none", pendingTimeFilter === '3days' && deliveryFilter === 'pending' ? "text-white/80" : "text-blue-600")}>
                    {appLanguage === 'ms' ? '3 Hari' : '3 Days'}
                  </span>
                  <span className={cn("text-base font-black leading-none mt-1 sm:mt-1.5", pendingTimeFilter === '3days' && deliveryFilter === 'pending' ? "text-white" : "text-blue-700")}>{pendingStats.day3}</span>
                </button>
              </div>
            )}

            {(() => {
              const matchedItems = localizedHistoryItems;

              if (matchedItems.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-16 text-subtext bg-surface border border-dashed border-gray-200 rounded-2xl">
                    <Clock className="w-12 h-12 mb-3 opacity-30" />
                    <p className="font-bold text-sm">
                      {appLanguage === 'ms'
                        ? 'Tiada tempahan yang dijumpai'
                        : 'No matching orders found'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  {matchedItems.map((item) => {
                  const lastEditedDateObj = new Date(item.timestamp || Date.now());
                  const formattedLastEditedDate = lastEditedDateObj.toLocaleString(
                    appLanguage === 'ms' ? 'ms-MY' : 'en-US',
                    {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    }
                  );

                  const rawDueTimestamp = getOrderDueTimestamp(item);
                  const hasDue = rawDueTimestamp !== null && rawDueTimestamp > 0;
                  const dueTimestamp = hasDue ? rawDueTimestamp : 0;
                  const formattedDueDate = hasDue
                    ? new Date(rawDueTimestamp).toLocaleString(
                        appLanguage === 'ms' ? 'ms-MY' : 'en-US',
                        {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }
                      )
                    : '';

                  const now = currentTime;
                  const isDelivered = !!item.state?.isDelivered;
                  const timeUntilDue = hasDue ? rawDueTimestamp - now : 0;
                  const isDueSoon = !isDelivered && hasDue && timeUntilDue > 0 && timeUntilDue <= 20 * 60 * 1000;
                  const isOverdue = !isDelivered && hasDue && timeUntilDue <= 0;

                  const relDetails = hasDue ? getRelativeDayDetails(rawDueTimestamp, appLanguage) : null;

                  let barColor = "bg-gray-300";
                  if (isDelivered) barColor = "bg-blue-500";
                  else if (isDueSoon) barColor = "bg-rose-500";
                  else if (isOverdue) barColor = "bg-amber-500 font-extrabold";
                  else if (item.state?.urgency === 'super' || item.state?.customerJenis?.toLowerCase().includes('super')) barColor = "bg-rose-600";
                  else if (item.state?.urgency === 'urgent' || item.state?.customerJenis?.toLowerCase().includes('urgent')) barColor = "bg-orange-500";
                  else if (item.state?.urgency === 'semi' || item.state?.customerJenis?.toLowerCase().includes('semi')) barColor = "bg-yellow-500";

                  return (
                    <div
                      key={item.id}
                      onClick={() => loadOrder(item)}
                      className={`bg-surface border relative overflow-hidden ${
                        isDelivered
                          ? 'border-blue-100 bg-blue-50/5 hover:border-blue-200'
                          : isDueSoon
                          ? 'border-red-200 bg-red-50/5 hover:border-red-300'
                          : isOverdue
                          ? 'border-amber-200 bg-amber-50/5 hover:border-amber-300/80'
                          : 'border-gray-200/60 hover:border-gray-300 shadow-sm'
                      } rounded-xl p-2.5 flex flex-col space-y-1 hover:bg-gray-50/65 cursor-pointer active:scale-[0.995] transition-all duration-200`}
                    >
                      {/* Left Accent Bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r ${barColor}`} />

                      <div className="pl-1.5">
                        <div className="flex justify-between items-start border-b border-gray-100/60 pb-1">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-1 mb-0.5">
                              <div
                                className={`flex items-center ${
                                  isDelivered
                                    ? 'text-blue-500 font-bold'
                                    : isDueSoon
                                    ? 'text-rose-600 font-bold'
                                    : isOverdue
                                    ? 'text-amber-600 font-bold'
                                    : 'text-primary/75 font-semibold'
                                } text-[10px] sm:text-[10.5px] uppercase tracking-wider`}
                              >
                                {isDelivered ? (
                                  <Check className="w-3 h-3 mr-1 text-blue-500" />
                                ) : isDueSoon ? (
                                  <Bell className="w-3 h-3 mr-1 text-rose-500 animate-pulse" />
                                ) : (
                                  <Calendar className="w-3 h-3 mr-1" />
                                )}

                                {item.state?.customerDue || formattedDueDate}

                                {isDueSoon && (
                                  <span className="ml-1 text-rose-600 lowercase font-bold">
                                    ({Math.ceil(timeUntilDue / 60000)}m)
                                  </span>
                                )}

                                {isDelivered && (
                                  <span className="ml-1 text-blue-500 lowercase">
                                    ({appLanguage === 'ms' ? 'Dihantar' : 'Delivered'})
                                  </span>
                                )}
                              </div>

                              {relDetails && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider ${relDetails.className}`}>
                                  {relDetails.text}
                                </span>
                              )}
                            </div>

                            <p className="font-bold text-sm sm:text-[13.5px] leading-tight text-[#111827]">
                              {item.state?.mainType === 'Lain-lain'
                                ? (item.state?.customDoc || item.state?.customerOrder || 'Dokumen')
                                : (item.state?.mainType || item.state?.customerOrder || 'Pesanan')}{' '}
                              {item.state?.isEditMode ? '(Edit)' : ''}
                              {item.state?.customerName
                                ? ` - ${formatCustomerName(item.state.customerName)}`
                                : ''}
                            </p>
                          </div>

                        <div className="flex items-center space-x-1.5 shrink-0 ml-1.5 cursor-default" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfirmAction({
                                title: appLanguage === 'ms' ? 'Padam Rekod?' : 'Delete Record?',
                                message: appLanguage === 'ms' 
                                  ? 'Adakah anda pasti mahu memadam rekod ini? Ia juga akan dipadamkan daripada Google Sheet anda.' 
                                  : 'Are you sure you want to delete this record? It will also be deleted from your Google Sheet.',
                                onConfirm: async () => {
                                  setConfirmAction(null);
                                  const spreadsheetId = item.state?.spreadsheetId || state.spreadsheetId;
                                  const orderId = item.state?.orderId;
                                  if (spreadsheetId && orderId) {
                                    await deleteOrderFromCloud(spreadsheetId, orderId);
                                  }
                                  deleteOrderFromHistory(item.id);
                                  handleGlobalSync(true);
                                }
                              });
                            }}
                            className="relative z-20 w-9 h-9 pointer-events-auto bg-red-100 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white hover:scale-110 active:scale-90 transition-all shadow-sm duration-200"
                            title={appLanguage === 'ms' ? 'Padam' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-xs mt-1 leading-normal">
                        <div className="w-full flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                          {[
                            (() => {
                              const pVal = extractPendapatanValue(item);
                              return pVal > 0 ? (
                                <span key="price" className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded text-[10.5px]">
                                  RM {pVal.toFixed(2)}
                                </span>
                              ) : null;
                            })(),
                            (item.state?.mainType === 'Resume' && !item.state?.isEditMode && item.state?.template) ? (
                              <span key="template" className="font-medium text-text">{item.state.template}</span>
                            ) : null,
                            item.state?.customerBahasa ? (
                              <span key="bahasa" className="font-medium text-text">{item.state.customerBahasa}</span>
                            ) : null,
                            item.state?.customerJenis ? (() => {
                              const val = String(item.state.customerJenis).toLowerCase();
                              let bColor = "text-gray-500 font-medium";
                              let displayVal = item.state.customerJenis;
                              if (val.includes('super')) { bColor = "text-super font-bold"; displayVal = "Super Urgent"; }
                              else if (val.includes('semi')) { bColor = "text-semi font-bold"; displayVal = "Semi Urgent"; }
                              else if (val.includes('normal') || val.includes('tak') || val.includes('not') || val.includes('tidak')) { bColor = "text-noturgent font-bold"; displayVal = appLanguage === 'ms' ? "Tidak Urgent" : "Not Urgent"; }
                              else if (val.includes('urgent')) { bColor = "text-urgent font-bold"; displayVal = "Urgent"; }
                              return <span key="jenis" className={bColor}>{displayVal}</span>;
                            })() : null
                          ].filter(Boolean).map((part, index, array) => (
                            <React.Fragment key={index}>
                              {part}
                              {index < array.length - 1 && <span className="text-gray-300 font-bold mx-0.5">•</span>}
                            </React.Fragment>
                          ))}
                        </div>

                        {item.state?.customerAddOn && (
                          <div className="w-full">
                            <span className="text-subtext">
                              {appLanguage === 'ms' ? 'Tambahan' : 'Add-ons'}:
                            </span>{' '}
                            <span className="font-medium text-text">{item.state.customerAddOn}</span>
                          </div>
                        )}

                        {item.state?.customerPhone && (
                          <div className="w-full flex items-center space-x-1.5 mt-0.5">
                            <span className="text-subtext">
                              {(() => {
                                const p = parsePhoneAndUsername(item.state.customerPhone);
                                if (p.phone && p.username) return appLanguage === 'ms' ? 'Tel / WA' : 'Phone / WA';
                                if (p.username) return 'WA';
                                return appLanguage === 'ms' ? 'Tel' : 'Phone';
                              })()}:
                            </span>{' '}
                            <a
                              href={getWhatsAppLink(item.state.customerPhone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-blue-600 hover:underline hover:text-blue-700 bg-blue-50/50 px-1.5 py-0 rounded flex items-center space-x-1 inline-flex text-[10px]"
                              title={appLanguage === 'ms' ? 'Hubungi di WhatsApp' : 'Contact on WhatsApp'}
                            >
                              <Phone className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                              <span className="select-all font-mono">
                              {formatDisplayPhone(String(item.state.customerPhone))}
                            </span>
                            </a>
                          </div>
                        )}

                        {item.state?.orderId && (
                          <div className="w-full flex items-center justify-between pt-0.5 mt-0.5">
                            <div className="flex-1 truncate mr-2">
                              <span className="text-subtext text-[10.5px]">Link:</span>{' '}
                              {item.state?.googleSheetLink ? (
                                <div className="flex flex-col gap-0.5">
                                  {item.state.googleSheetLink
                                    .split(/[\n,]+/)
                                    .filter(Boolean)
                                    .map((link, idx) => (
                                      <a
                                        key={idx}
                                        href={link.trim()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline font-medium truncate inline-block max-w-[150px] sm:max-w-[250px] text-[10.5px]"
                                        onClick={(e) => e.stopPropagation()}
                                        title={link.trim()}
                                      >
                                        {link.trim()}
                                      </a>
                                    ))}
                                </div>
                              ) : (
                                <span className="text-gray-400 italic font-medium text-[10px]">
                                  {appLanguage === 'ms' ? 'Belum dimasukkan' : 'Not entered'}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleSyncLink(e, item)}
                              disabled={syncingId === item.id}
                              className="shrink-0 flex items-center justify-center bg-gray-100 hover:bg-gray-200 hover:scale-105 active:scale-95 text-text p-1 rounded-full transition-all disabled:opacity-50"
                              title={appLanguage === 'ms' ? 'Sync Link dari Google Sheet' : 'Sync Link from Google Sheet'}
                            >
                              <RefreshCcw
                                className={`w-3 h-3 ${
                                  syncingId === item.id ? 'animate-spin text-primary' : ''
                                }`}
                              />
                            </button>
                          </div>
                        )}

                        <div className="w-full pt-1.5 mt-1 border-t border-gray-100/65 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={(e) => handleDeliveredToggle(e, item, isDelivered)}
                            className={`px-2 py-1 text-[10px] font-bold rounded-md flex items-center hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-xs ${
                              isDelivered
                                ? 'bg-blue-50 text-blue-600 border border-blue-200/60 hover:bg-blue-100'
                                : 'bg-white text-gray-400 border border-gray-150 hover:bg-gray-50 hover:text-gray-600'
                            }`}
                          >
                            <Check
                              className={`w-3 h-3 mr-1 ${
                                isDelivered ? 'text-blue-500' : 'text-gray-400'
                              }`}
                            />
                            {appLanguage === 'ms'
                              ? isDelivered
                                ? 'Dihantar'
                                : 'Belum Dihantar'
                              : isDelivered
                              ? 'Delivered'
                              : 'Not Delivered'}
                          </button>

                          <div className="text-[9.5px] text-right text-subtext font-medium leading-none select-none">
                            <span className="opacity-75">{appLanguage === 'ms' ? 'Disunting: ' : 'Edited: '}</span>
                            <span className="font-semibold text-text/80">{formattedLastEditedDate}</span>
                          </div>
                        </div>

                        {item.state.syncStatus && (
                          <div className="w-full pt-2 mt-1.5 border-t border-dashed border-gray-100/80 flex items-start justify-between bg-gray-50/50 -mx-3 -mb-3 px-3 py-2 rounded-b-xl">
                            <div className="text-[9.5px] flex items-center">
                              {item.state.syncStatus === 'saved_locally' && <span className="text-gray-500 font-medium">Saved locally</span>}
                              {item.state.syncStatus === 'syncing' && <span className="text-blue-500 font-semibold animate-pulse flex items-center"><RefreshCcw className="w-2.5 h-2.5 mr-1 animate-spin" /> Syncing…</span>}
                              {item.state.syncStatus === 'sent_unverified' && (
  <span className="text-amber-600 font-semibold flex items-center">
    <AlertCircle className="w-2.5 h-2.5 mr-1" />
    Sent — awaiting verification
  </span>
)}
                              {item.state.syncStatus === 'synced' && <span className="text-emerald-600 font-bold flex items-center"><Check className="w-2.5 h-2.5 mr-1"/> Synced</span>}
                              {item.state.syncStatus === 'failed' && (
                                <button 
                                  type="button"
                                  className="text-red-600 font-bold hover:underline flex items-center active:scale-95 transition-transform"
                                  onClick={(e) => handleDeliveredToggle(e, item, isDelivered, true)}
                                >
                                  <AlertCircle className="w-2.5 h-2.5 mr-1" /> Sync failed — tap to retry
                                </button>
                              )}
                            </div>
                            {(item.state.syncLastSuccess || item.state.syncFailCount) && (
                              <div className="text-[8.5px] text-gray-400 text-right leading-tight">
                                {item.state.syncLastSuccess && <div>Last sync: <span className="font-medium text-gray-500">{new Date(item.state.syncLastSuccess).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>}
                                {!!item.state.syncFailCount && item.state.syncFailCount > 0 && <div className="text-red-400 font-medium mt-0.5">Failed attempts: {item.state.syncFailCount}</div>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    )}
  </div>
  );
}
