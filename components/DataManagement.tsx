import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  getEntriesView, 
  getDailyStats, 
  getWeeklyStats, 
  getMonthlyStats, 
  getReportView,
  downloadCSV,
  parseTextToGrid,
  convertGridToEntries,
  HEADERS
} from '../services/analytics';
import { Table, Calendar, FileText, Download, ClipboardPaste, X, Check, Copy, Archive, RotateCcw, Plus, ChevronDown, Trash2 } from 'lucide-react';

type DataTab = 'ENTRIES' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'REPORT';

const DataManagement: React.FC = () => {
  const { entries, inactiveEntries, loadInactiveData, importData, appendData, restoreEntryById, archiveAllData } = useApp();
  const [activeTab, setActiveTab] = useState<DataTab>('ENTRIES');
  
  // Data is already loaded in Context
  useEffect(() => {
    loadInactiveData();
  }, []);

  // Import Modal State
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  
  // Preview State
  const [previewGrid, setPreviewGrid] = useState<string[][]>([]);
  
  // Memoize data calculations
  const entriesData = useMemo(() => getEntriesView(entries), [entries]);
  const dailyData = useMemo(() => getDailyStats(entries), [entries]);
  const weeklyData = useMemo(() => getWeeklyStats(entries), [entries]);
  const monthlyData = useMemo(() => getMonthlyStats(entries), [entries]);
  const reportData = useMemo(() => getReportView(entries), [entries]);

  const getCurrentData = () => {
    switch(activeTab) {
      case 'ENTRIES': return entriesData;
      case 'DAILY': return dailyData;
      case 'WEEKLY': return weeklyData;
      case 'MONTHLY': return monthlyData;
      case 'REPORT': return reportData;
      default: return [];
    }
  };

  const currentHeaders = HEADERS[activeTab];

  const handleDownload = () => {
    const data = getCurrentData();
    const dateStr = new Date().toISOString().split('T')[0];
    if (data.length > 0) {
        downloadCSV(data, `Jalpan_${activeTab}_${dateStr}.csv`);
    } else {
        const dummy = currentHeaders.reduce((acc, h) => ({...acc, [h]: ''}), {});
        downloadCSV([dummy], `Template_${activeTab}.csv`);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    if (!text) return;

    try {
        const grid = parseTextToGrid(text);
        if (grid.length > 0) {
            setPreviewGrid(grid);
        }
    } catch (err) {
        console.error(err);
        alert("Failed to parse clipboard data.");
    }
  };

  const processImport = (mode: 'REPLACE' | 'APPEND') => {
    try {
        if (previewGrid.length === 0) return;
        
        // Process Data
        const result = convertGridToEntries(previewGrid);
        
        if (result.validEntries.length === 0) {
            alert("Could not extract any data rows. Please ensure you copied a table.");
            return;
        }

        if (mode === 'REPLACE') {
            importData(result.validEntries); // Will archive old and import
            setImportModalOpen(false);
            setPreviewGrid([]);
        } else {
            appendData(result.validEntries);
            setImportModalOpen(false);
            setPreviewGrid([]);
        }
    } catch (error) {
        console.error("Import error:", error);
        alert("An unexpected error occurred. Check console.");
    }
  };

  const copyHeadersToClipboard = () => {
      const headerStr = HEADERS.ENTRIES.join('\t');
      navigator.clipboard.writeText(headerStr);
      alert("Headers copied! Paste into row 1 of your Excel sheet.");
  };

  const clearPreview = () => {
      setPreviewGrid([]);
  };

  const TabButton = ({ id, label, icon: Icon }: { id: DataTab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`
        flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap
        ${activeTab === id 
          ? 'border-green-600 text-green-800 bg-green-50' 
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
        }
      `}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  const renderTable = () => {
    const data = getCurrentData();
    const headers = currentHeaders;
    const displayData = data.length > 0 ? data : Array(10).fill({});

    return (
      <div className="overflow-x-auto border border-slate-300">
        <table className="min-w-full text-xs text-left whitespace-nowrap border-collapse">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="w-10 px-2 py-2 border border-slate-300 text-center text-slate-400 font-normal bg-slate-50 sticky left-0 z-10">#</th>
              {headers.map(h => (
                <th key={h} className="px-3 py-2 border border-slate-300 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {displayData.map((row: any, i) => (
              <tr key={i} className="hover:bg-blue-50">
                <td className="px-2 py-1 border border-slate-300 text-center text-slate-400 bg-slate-50 font-mono sticky left-0">{i + 1}</td>
                {headers.map(h => {
                  const val = row[h];
                  const hasVal = val !== undefined && val !== null;
                  const isNumber = typeof val === 'number';
                  const isCurrency = h.includes('(₹)') || ['Total_Amount', 'Amount', 'Cost', 'Balance'].some(k => h.includes(k));
                  
                  return (
                    <td key={h} className={`px-3 py-1 border border-slate-300 text-slate-800 ${isNumber ? 'text-right font-mono' : ''} ${!hasVal ? 'bg-slate-50/50' : ''}`}>
                      {hasVal ? (isNumber && isCurrency 
                        ? (val === 0 ? '-' : `₹${val.toLocaleString()}`)
                        : val) : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="bg-white rounded-none shadow-sm border border-slate-300 flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-slate-300 bg-slate-50 p-2 flex flex-col sm:flex-row justify-between items-center gap-4">
           
           {/* Desktop Tabs */}
           <div className="hidden sm:flex overflow-x-auto no-scrollbar w-full sm:w-auto">
             <TabButton id="ENTRIES" label="Entries" icon={Table} />
             <TabButton id="DAILY" label="Daily" icon={Calendar} />
             <TabButton id="WEEKLY" label="Weekly" icon={Calendar} />
             <TabButton id="MONTHLY" label="Monthly" icon={Calendar} />
             <TabButton id="REPORT" label="Report" icon={FileText} />
           </div>

           {/* Mobile Dropdown */}
           <div className="sm:hidden w-full relative">
               <select
                 value={activeTab}
                 onChange={(e) => setActiveTab(e.target.value as DataTab)}
                 className="w-full appearance-none bg-white border border-slate-300 text-slate-800 py-3 px-4 pr-8 rounded-lg font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
               >
                 <option value="ENTRIES">Entries</option>
                 <option value="DAILY">Daily Stats</option>
                 <option value="WEEKLY">Weekly Stats</option>
                 <option value="MONTHLY">Monthly Stats</option>
                 <option value="REPORT">Report View</option>
               </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <ChevronDown size={18} />
               </div>
           </div>

           <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto overflow-x-auto no-scrollbar">
             {/* Archive All Button */}
             <button 
                onClick={archiveAllData}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded shadow-sm hover:bg-amber-100 transition font-bold text-sm whitespace-nowrap"
                title="Mark all current active entries as Inactive"
             >
                <Archive size={16} /> Archive All
             </button>

             {activeTab === 'ENTRIES' && (
                 <button 
                  onClick={() => setImportModalOpen(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-700 text-white px-4 py-2 rounded shadow-sm hover:bg-green-800 transition font-bold text-sm whitespace-nowrap"
                 >
                     <ClipboardPaste size={16} /> Paste Data
                 </button>
             )}
             <button 
              onClick={handleDownload}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-200 text-slate-800 px-4 py-2 rounded shadow-sm hover:bg-slate-300 transition font-medium text-sm whitespace-nowrap"
             >
                 <Download size={16} /> Export
             </button>
           </div>
        </div>

        {/* Info Strip */}
        <div className="bg-white border-b border-slate-300 px-4 py-1 text-xs text-slate-500 flex justify-between">
           <span>{getCurrentData().length} rows</span>
           <span>Sheet: {activeTab} {activeTab !== 'ENTRIES' ? '(Read Only - Calculated)' : ''}</span>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4">
           <div className="bg-white shadow-sm inline-block min-w-full">
             {renderTable()}
           </div>
           
           {/* INACTIVE DATA SECTION */}
           {inactiveEntries.length > 0 && (
             <div className="mt-8 border-t border-slate-200 pt-6">
               <h3 className="text-lg font-bold text-slate-500 flex items-center gap-2 mb-4">
                   <Archive className="text-slate-400" /> Inactive Data (Archived / Deleted)
               </h3>
               <div className="bg-white border border-rose-200 rounded-lg overflow-hidden shadow-sm">
                 <table className="min-w-full text-xs text-left">
                    <thead className="bg-rose-50 text-rose-800">
                        <tr>
                            <th className="px-4 py-2">Action</th>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Type</th>
                            <th className="px-4 py-2">Details</th>
                            <th className="px-4 py-2 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100">
                        {inactiveEntries.map(entry => (
                            <tr key={entry.id} className="bg-rose-50/30 hover:bg-rose-50">
                                <td className="px-4 py-2">
                                    <button 
                                        onClick={() => {
                                            if(window.confirm('Restore this entry to Active status?')) restoreEntryById(entry.id);
                                        }}
                                        className="flex items-center gap-1 text-emerald-600 font-bold hover:underline"
                                    >
                                        <RotateCcw size={14} /> Restore (Make Active)
                                    </button>
                                </td>
                                <td className="px-4 py-2">{entry.date}</td>
                                <td className="px-4 py-2">{entry.type}</td>
                                <td className="px-4 py-2">{entry.notes || entry.couponType || '-'}</td>
                                <td className="px-4 py-2 text-right">₹{entry.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
               </div>
             </div>
           )}
        </div>
      </div>
      
      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl flex flex-col h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <ClipboardPaste className="text-green-600"/> Import Entries (Excel Paste)
              </h3>
              <button onClick={() => setImportModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                 <div className="flex gap-4 items-center">
                    <button 
                        onClick={copyHeadersToClipboard}
                        className="flex items-center gap-2 bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded shadow-sm hover:bg-blue-50 text-xs font-bold"
                    >
                        <Copy size={14}/> Copy Headers
                    </button>
                    <span className="text-xs text-slate-500 hidden sm:inline">1. Copy Headers to Excel &rarr; 2. Add Data &rarr; 3. Copy All &rarr; 4. Paste below</span>
                 </div>
                 {previewGrid.length > 0 && (
                     <button onClick={clearPreview} className="text-rose-600 text-xs font-bold hover:underline flex items-center gap-1">
                         <Trash2 size={12}/> Clear & Paste Again
                     </button>
                 )}
            </div>

            <div className="flex-1 p-4 overflow-hidden flex flex-col">
              {previewGrid.length === 0 ? (
                // Paste Target Area
                <div 
                    onPaste={handlePaste}
                    className="flex-1 border-4 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition cursor-text"
                    tabIndex={0}
                >
                    <ClipboardPaste size={48} className="mb-4 text-slate-300"/>
                    <p className="font-bold text-lg">Click here and press Ctrl+V</p>
                    <p className="text-sm">to paste your Excel data</p>
                </div>
              ) : (
                // Table Preview
                <div className="flex-1 overflow-auto border border-slate-300 rounded-lg bg-white shadow-inner">
                   <table className="min-w-full text-xs text-left whitespace-nowrap border-collapse">
                      <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                        <tr>
                            {previewGrid[0].map((h, i) => (
                                <th key={i} className="px-2 py-2 border border-slate-300 font-bold text-slate-700">{h}</th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                         {previewGrid.slice(1).map((row, i) => (
                             <tr key={i}>
                                 {row.map((cell, c) => (
                                     <td key={c} className="px-2 py-1 border border-slate-200 truncate max-w-[150px]">{cell}</td>
                                 ))}
                             </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-between items-center">
              <div>
                  {previewGrid.length > 0 && (
                      <span className="text-xs text-slate-500 font-medium">Previewing {previewGrid.length - 1} rows</span>
                  )}
              </div>
              <div className="flex gap-3">
                <button 
                    onClick={() => setImportModalOpen(false)}
                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition"
                >
                    Cancel
                </button>
                
                {/* Append Button - Always Enabled if Grid > 0 */}
                <button 
                    onClick={() => processImport('APPEND')}
                    disabled={previewGrid.length === 0}
                    className="px-6 py-2 bg-sky-600 text-white font-bold rounded-lg shadow hover:bg-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Plus size={18} /> Append
                </button>

                {/* Replace Button */}
                <button 
                    onClick={() => processImport('REPLACE')}
                    disabled={previewGrid.length === 0}
                    className="px-6 py-2 bg-rose-600 text-white font-bold rounded-lg shadow hover:bg-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Check size={18} /> Replace All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagement;