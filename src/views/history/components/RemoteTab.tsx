import React from 'react';
import { Trash2, Calendar, AlertCircle, RefreshCcw, Save, Check, Search, Database, Phone, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { getWhatsAppLink, parsePhoneAndUsername } from '../../../utils';
import type { HistoryController } from '../useHistoryController';
import { formatCustomerName, formatDisplayPhone } from '../helpers';
import { safeSetItem } from '../../../lib/safeStorage';

export function RemoteTab({ c }: { c: HistoryController }) {
  const { annualSheets, appLanguage, globalScriptUrl, handleGlobalSync, handleLoadRemoteOrder, handleRemoteDeliveredToggle, handleRemoteSearch, isSearching, remoteResults, searchError, searchQuery, setAlertMsg, setAnnualSheets, setConfirmAction, setGlobalScriptUrl, setRemoteResults, setSearchQuery, setShowDbSettings, showDbSettings, updateOrderHistoryState } = c;
  return (
    <div className="space-y-4 mt-2.5">
        <div className="bg-surface border border-gray-100 p-4 rounded-xl shadow-sm space-y-3">
          <button
            type="button"
            onClick={handleRemoteSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="w-full h-11 bg-primary text-white font-bold rounded-xl flex items-center justify-center space-x-2 active:scale-[0.98] transition-all disabled:opacity-50 text-xs shadow-sm"
          >
            {isSearching ? (
              <RefreshCcw className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>{appLanguage === 'ms' ? 'Cari Database Cloud' : 'Search Cloud Database'}</span>
          </button>
        </div>

        {/* Pautan & Tetapan Database (3 Tahun) */}
        <div className="bg-surface border border-gray-100 rounded-xl shadow-sm overflow-hidden transition-all duration-200">
          <button
            type="button"
            onClick={() => setShowDbSettings(!showDbSettings)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-text hover:bg-gray-50/50 transition-colors"
            id="btn-db-settings-toggle"
          >
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-primary" />
              <span>{appLanguage === 'ms' ? 'Pautan & Tetapan Database Tahunan' : 'Annual Database Connection & Settings'}</span>
            </div>
            {showDbSettings ? (
              <ChevronUp className="w-4 h-4 text-subtext/70" />
            ) : (
              <ChevronDown className="w-4 h-4 text-subtext/70" />
            )}
          </button>

          {showDbSettings && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/30 space-y-4 animate-in slide-in-from-top-1 duration-150">
              <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 text-xs text-blue-800 leading-relaxed">
                {appLanguage === 'ms' 
                  ? 'Konfigurasikan Spreadsheet ID bagi setiap tahun. Anda boleh memasukkan pautan Google Sheet penuh (URL) atau ID terus.'
                  : 'Configure the Spreadsheet ID for each year. You can paste the full Google Sheet Link (URL) or directly the Spreadsheet ID.'}
              </div>

              {/* Web App Script URL block shared for all */}
              <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
                  {appLanguage === 'ms' ? 'Pautan Web App Apps Script (Kongsi Untuk Semua):' : 'Global Web App Apps Script URL (Shared for All):'}
                </span>
                <input
                  type="text"
                  className="w-full text-xs bg-gray-50 font-mono rounded px-2.5 py-1.5 border border-gray-200 outline-none text-text focus:bg-white"
                  value={globalScriptUrl}
                  onChange={(e) => setGlobalScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
              </div>

              <div className="space-y-4">
                {annualSheets.map((sheet, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm space-y-2.5 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary shrink-0">
                          {appLanguage === 'ms' ? 'Tahun:' : 'Year:'}
                        </label>
                        <input
                          type="text"
                          value={sheet.year}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAnnualSheets(prev => prev.map((s, idx) => idx === index ? { ...s, year: val } : s));
                          }}
                          className="bg-gray-50 px-2 py-0.5 rounded text-[10px] font-bold text-text border border-gray-200 max-w-[80px] outline-none text-left"
                          placeholder="e.g. 2024"
                        />
                      </div>
                      {annualSheets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmAction({
                              title: appLanguage === 'ms' ? 'Padam Konfigurasi?' : 'Delete Configuration?',
                              message: appLanguage === 'ms' 
                                ? `Anda pasti mahu memadam konfigurasi tahun ${sheet.year}?` 
                                : `Are you sure you want to delete year ${sheet.year} configuration?`,
                              onConfirm: () => {
                                setAnnualSheets(prev => prev.filter((_, idx) => idx !== index));
                                setConfirmAction(null);
                              }
                            });
                          }}
                          className="w-8 h-8 flex items-center justify-center hover:bg-red-50 text-red-500 rounded-full transition-all active:scale-90"
                          title={appLanguage === 'ms' ? 'Hapus' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-subtext font-medium block">
                        {appLanguage === 'ms' ? 'Pautan / ID Google Sheet:' : 'Google Sheet URL / Spreadsheet ID:'}
                      </span>
                      <div className="relative">
                        <input
                          type="text"
                          value={sheet.spreadsheetId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAnnualSheets(prev => prev.map((s, idx) => idx === index ? { ...s, spreadsheetId: val } : s));
                          }}
                          placeholder={appLanguage === 'ms' ? 'Salin pautan Google Sheet di sini...' : 'Paste Google Sheet Link here...'}
                          className="w-full text-xs bg-gray-50 font-mono rounded px-2.5 py-1.5 border border-gray-200 outline-none text-text focus:bg-white"
                        />
                        {sheet.spreadsheetId && (
                          <span className="text-[10px] text-green-600 block mt-1 font-semibold">
                            ✓ ID: {sheet.spreadsheetId.includes('docs.google.com/spreadsheets/d/') 
                              ? (sheet.spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1] || 'URL valid') 
                              : 'Raw ID'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setAnnualSheets(prev => [...prev, { year: '', spreadsheetId: '', scriptUrl: '' }]);
                }}
                className="w-full py-2.5 border border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 text-subtext font-bold rounded-xl flex items-center justify-center space-x-1.5 text-xs active:scale-[0.98] transition-all bg-white"
              >
                <span className="text-base font-normal">+</span>
                <span>{appLanguage === 'ms' ? 'Tambah Tahun Baru' : 'Add New Year'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  safeSetItem('db_annual_sheets', JSON.stringify(annualSheets));
                  safeSetItem('db_global_script_url', globalScriptUrl);
                  // Save and sync with context state
                  const firstActive = annualSheets.find(s => s.spreadsheetId !== '');
                  if (firstActive) {
                    const extractId = (input: string) => {
                      if (input.includes('docs.google.com/spreadsheets/d/')) {
                        const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
                        return match ? match[1] : input;
                      }
                      return input;
                    };
                    updateOrderHistoryState({ spreadsheetId: extractId(firstActive.spreadsheetId) });
                  }
                  setAlertMsg({
                    type: 'success',
                    message: appLanguage === 'ms' 
                      ? 'Konfigurasi pautan database tahunan berjaya disimpan!' 
                      : 'Annual database configurations successfully saved!'
                  });
                  setShowDbSettings(false);
                  handleGlobalSync(true);
                }}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center space-x-1 text-xs active:scale-95 transition-all shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{appLanguage === 'ms' ? 'Simpan Tetapan' : 'Save Connection Settings'}</span>
              </button>
            </div>
          )}
        </div>

        {searchError && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-100 flex items-center space-x-2 animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
            <span>{searchError}</span>
          </div>
        )}

        {isSearching && (
          <div className="flex flex-col items-center justify-center py-16 text-subtext">
            <RefreshCcw className="w-7 h-7 mb-3 animate-spin text-primary opacity-80" />
            <p className="font-bold text-xs select-none">
              {appLanguage === 'ms' ? 'Sedang mencari di lembaran tahunan...' : 'Searching across annual sheets...'}
            </p>
          </div>
        )}

        {!isSearching && remoteResults.length > 0 && (
          <div className="space-y-2.5 animate-fade-in-up">
            <div className="flex items-center justify-between pl-1">
              <p className="text-[10px] font-bold text-subtext uppercase tracking-widest">
                {appLanguage === 'ms' 
                  ? `Hasil Carian (${remoteResults.length} Rekod)` 
                  : `Search Results (${remoteResults.length} Records)`}
              </p>
              <button 
                type="button"
                onClick={() => {
                  setRemoteResults([]);
                  setSearchQuery('');
                }}
                className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 uppercase tracking-widest px-2 py-1 rounded transition-colors flex flex-shrink-0 items-center justify-center"
                id="btn-clear-search"
              >
                {appLanguage === 'ms' ? 'Padam Carian' : 'Clear Results'}
              </button>
            </div>

            {remoteResults.map((item, idx) => {
              const isDelivered = !!item.isDelivered;
              const orderId = item.orderId || item.generatedId || `SYNC-TMP-${idx}`;

              return (
                <div
                  key={orderId + '-' + idx}
                  onClick={() => handleLoadRemoteOrder(item)}
                  className={`bg-surface border relative overflow-hidden ${
                    isDelivered
                      ? 'border-blue-100 bg-blue-50/5 hover:border-blue-200'
                      : 'border-gray-200/60 hover:border-gray-300 shadow-sm'
                  } rounded-xl p-2.5 flex flex-col space-y-1 hover:bg-gray-50/65 cursor-pointer active:scale-[0.995] transition-all duration-200`}
                >
                  {/* Left Accent Bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r ${isDelivered ? 'bg-blue-400' : 'bg-gray-300'}`} />

                  <div className="pl-1.5">
                    <div className="flex justify-between items-start border-b border-gray-100/60 pb-1">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-1 mb-0.5">
                          <div
                            className={`flex items-center ${
                              isDelivered
                                ? 'text-blue-500 font-bold'
                                : 'text-primary/75 font-semibold'
                            } text-[10px] sm:text-[10.5px] uppercase tracking-wider`}
                          >
                            {isDelivered ? (
                              <Check className="w-3 h-3 mr-1 text-blue-500" />
                            ) : (
                              <Calendar className="w-3 h-3 mr-1" />
                            )}
                            {item.due || (appLanguage === 'ms' ? 'Tiada Tarikh' : 'No Date')}

                            {isDelivered && (
                              <span className="ml-1 text-blue-500 lowercase">
                                ({appLanguage === 'ms' ? 'Dihantar' : 'Delivered'})
                              </span>
                            )}
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-purple-100 text-purple-700">
                            <Database className="w-2.5 h-2.5 inline mr-0.5" />
                            {item.sheetName || 'Google Sheet'}
                          </span>
                        </div>

                        <p className="font-bold text-sm sm:text-[13.5px] leading-tight text-[#111827]">
                          {item.order || 'Pesanan'}
                          {item.name ? ` - ${formatCustomerName(item.name)}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-xs mt-1 leading-normal">
                      <div className="w-full flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        {[
                          item.template ? (
                            <span key="template" className="font-medium text-[#374151]">{item.template}</span>
                          ) : null,
                          item.bahasa ? (
                            <span key="bahasa" className="font-medium text-[#374151]">{item.bahasa}</span>
                          ) : null,
                          item.jenis ? (() => {
                            const val = String(item.jenis).toLowerCase();
                            let bColor = "text-gray-500 font-medium";
                            let displayVal = item.jenis;
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
                    </div>

                    <div className="flex flex-col gap-0.5 mt-1 text-[11.5px] text-subtext leading-snug">
                      {item.addon && (
                        <div className="truncate">
                          <span className="font-semibold text-gray-500">{(appLanguage === 'ms' ? 'Tambahan: ' : 'Add On: ')}</span>
                          <span className="text-gray-700 font-medium">{item.addon}</span>
                        </div>
                      )}
                      
                      {item.phone && (
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="font-semibold text-gray-500">
                            {(() => {
                              const p = parsePhoneAndUsername(item.phone);
                              if (p.phone && p.username) return appLanguage === 'ms' ? 'Tel / WA:' : 'Phone / WA:';
                              if (p.username) return 'WA:';
                              return appLanguage === 'ms' ? 'Tel:' : 'Phone:';
                            })()}
                          </span>
                          <a
                            href={getWhatsAppLink(item.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold text-blue-600 hover:underline hover:text-blue-700 bg-blue-50/50 px-1.5 py-0 rounded flex items-center space-x-1 inline-flex text-[10px]"
                            title={appLanguage === 'ms' ? 'Hubungi di WhatsApp' : 'Contact on WhatsApp'}
                          >
                            <Phone className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                            <span className="select-all font-mono">
                              {formatDisplayPhone(item.phone)}
                            </span>
                          </a>
                        </div>
                      )}

                      {item.orderId && (
                        <div className="mt-0.5"><span className="font-semibold text-gray-500">ID:</span> <span className="font-mono text-[10.5px] font-semibold text-text/80 bg-gray-55 px-1 rounded">{item.orderId}</span></div>
                      )}

                      {item.link && (
                        <div className="w-full pt-1">
                          <span className="font-semibold text-gray-500">Link:</span>{' '}
                          <div className="flex flex-col gap-0.5">
                            {item.link
                              .split(/[\n,]+/)
                              .filter(Boolean)
                              .map((lnk: string, lIdx: number) => (
                                <a
                                  key={lIdx}
                                  href={lnk.trim()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline font-medium truncate inline-block max-w-[200px] sm:max-w-[300px] text-[10.5px]"
                                  onClick={(e) => e.stopPropagation()}
                                  title={lnk.trim()}
                                >
                                  {lnk.trim()}
                                </a>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="w-full pt-1.5 mt-1 border-t border-gray-100/65 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => handleRemoteDeliveredToggle(e, idx, item)}
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
                    </div>

                    {item.syncStatus && (
                      <div className="w-full pt-2 mt-1.5 border-t border-dashed border-gray-100/80 flex items-start justify-between bg-gray-50/50 -mx-3 -mb-3 px-3 py-2 rounded-b-xl">
                        <div className="text-[10px] flex items-center">
                          {item.syncStatus === 'syncing' && <span className="text-blue-500 font-semibold animate-pulse flex items-center"><RefreshCcw className="w-2.5 h-2.5 mr-1 animate-spin" /> Syncing…</span>}
                          {item.syncStatus === 'sent_unverified' && (
  <span className="text-amber-600 font-semibold flex items-center">
    <AlertCircle className="w-2.5 h-2.5 mr-1" />
    Sent — awaiting verification
  </span>
)}
                          {item.syncStatus === 'synced' && <span className="text-emerald-600 font-bold flex items-center"><Check className="w-2.5 h-2.5 mr-1"/> Synced</span>}
                          {item.syncStatus === 'failed' && (
                            <button 
                              type="button"
                              className="text-red-600 font-bold hover:underline flex items-center active:scale-95 transition-transform"
                              onClick={(e) => handleRemoteDeliveredToggle(e, idx, item, true)}
                            >
                              <AlertCircle className="w-2.5 h-2.5 mr-1" /> Sync failed — tap to retry
                            </button>
                          )}
                        </div>
                        {(item.syncLastSuccess || item.syncFailCount) && (
                          <div className="text-[10px] text-gray-400 text-right leading-tight">
                            {item.syncLastSuccess && <div>Last sync: <span className="font-medium text-gray-500">{new Date(item.syncLastSuccess).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>}
                            {!!item.syncFailCount && item.syncFailCount > 0 && <div className="text-red-400 font-medium mt-0.5">Failed attempts: {item.syncFailCount}</div>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isSearching && remoteResults.length === 0 && !searchError && (
          <div className="flex flex-col items-center justify-center py-20 text-subtext animate-fade-in-up">
            <Search className="w-16 h-16 mb-4 opacity-30 animate-pulse" />
            <p className="font-bold text-center text-xs text-text/60 md:max-w-[260px] leading-relaxed">
              {appLanguage === 'ms' 
                ? 'Masukkan nama, Order ID, atau No. telefon untuk mencari di lembaran tahunan.' 
                : 'Enter customer name, Order ID, or Phone No to search across annual sheets.'}
            </p>
          </div>
        )}
      </div>
  );
}
