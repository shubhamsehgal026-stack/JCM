import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { COUPON_CONFIGS } from '../constants';
import { EntryMode } from '../types';
import { ArrowRight, Calculator, Hash, Layers, Delete, Trash2, Edit2, XCircle, Edit } from 'lucide-react';

interface TransactionPanelProps {
  mode: 'ISSUE' | 'WITHDRAW';
  children?: React.ReactNode;
}

// Vibrant colors for digits 0-9
const DIGIT_STYLES: Record<number, string> = {
  1: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
  2: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200",
  3: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200",
  4: "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200",
  5: "bg-lime-100 text-lime-700 border-lime-200 hover:bg-lime-200",
  6: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200",
  7: "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200",
  8: "bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200",
  9: "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200",
  0: "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200",
};

const TransactionPanel: React.FC<TransactionPanelProps> = ({ mode, children }) => {
  const { 
      selectedCoupon, 
      addEntry, 
      deleteLastEntry, 
      editingEntry, 
      updateExistingEntry, 
      cancelEditing,
      entries,
      currentDate,
      deleteEntryById,
      startEditing
  } = useApp();
  
  const config = COUPON_CONFIGS.find(c => c.label === selectedCoupon) || COUPON_CONFIGS[0];

  // Entry Method State (Toggle)
  const [entryMethod, setEntryMethod] = useState<EntryMode>('SERIAL');

  // ISSUE STATE
  const [issueBooklets, setIssueBooklets] = useState("");
  const [issueStart, setIssueStart] = useState("");
  const [issueEnd, setIssueEnd] = useState("");
  const [issueNotes, setIssueNotes] = useState("");

  // WITHDRAW STATE
  const [withdrawBooklets, setWithdrawBooklets] = useState("");
  const [withdrawStart, setWithdrawStart] = useState("");
  const [withdrawEnd, setWithdrawEnd] = useState("");
  const [withdrawNotes, setWithdrawNotes] = useState("");

  // Derived Values for Live Preview
  const [livePreview, setLivePreview] = useState({ qty: 0, amount: 0, type: 'NONE' });

  // Reset inputs and default to SERIAL when mode changes
  useEffect(() => {
    // Only reset if NOT editing
    if (!editingEntry) {
        setLivePreview({ qty: 0, amount: 0, type: 'NONE' });
        setEntryMethod('SERIAL');
        setIssueBooklets(""); setIssueStart(""); setIssueEnd(""); setIssueNotes("");
        setWithdrawBooklets(""); setWithdrawStart(""); setWithdrawEnd(""); setWithdrawNotes("");
    }
  }, [mode, editingEntry]);

  // Load Edit Data
  useEffect(() => {
      if (editingEntry && editingEntry.type === mode) {
          setEntryMethod(editingEntry.entryMode || 'SERIAL');
          
          if (mode === 'ISSUE') {
              setIssueBooklets(editingEntry.quantity ? (editingEntry.quantity / config.bundleSize).toString() : "");
              setIssueStart(editingEntry.serialStart ? editingEntry.serialStart.toString() : "");
              setIssueEnd(editingEntry.serialEnd ? editingEntry.serialEnd.toString() : "");
              setIssueNotes(editingEntry.notes || "");
          } else {
              setWithdrawBooklets(editingEntry.quantity ? (editingEntry.quantity / config.bundleSize).toString() : "");
              setWithdrawStart(editingEntry.serialStart ? editingEntry.serialStart.toString() : "");
              setWithdrawEnd(editingEntry.serialEnd ? editingEntry.serialEnd.toString() : "");
              setWithdrawNotes(editingEntry.notes || "");
          }
      }
  }, [editingEntry, mode, config.bundleSize]);

  // Auto-fill End Serial Logic (For manual typing)
  useEffect(() => {
    if (entryMethod === 'SERIAL' && !editingEntry) {
        if (issueStart) {
          const start = parseInt(issueStart);
          if (!isNaN(start)) {
            const calculatedEnd = (start + config.bundleSize - 1).toString();
            if (calculatedEnd !== issueEnd) setIssueEnd(calculatedEnd);
          }
        }
    }
  }, [issueStart, config.bundleSize, entryMethod, editingEntry]);

  useEffect(() => {
    if (entryMethod === 'SERIAL' && !editingEntry) {
        if (withdrawStart) {
          const start = parseInt(withdrawStart);
          if (!isNaN(start)) {
            // UPDATED LOGIC: Snap to the end of the standard bundle
            // Example: Start 43521 (Size 100) -> End 43600 (Instead of 43620)
            // Logic: Round UP to nearest multiple of bundleSize
            const calculatedEnd = (Math.ceil(start / config.bundleSize) * config.bundleSize).toString();
            if (calculatedEnd !== withdrawEnd) setWithdrawEnd(calculatedEnd);
          }
        }
    }
  }, [withdrawStart, config.bundleSize, entryMethod, editingEntry]);

  // Live Calculation Logic
  useEffect(() => {
    let qty = 0;
    let type = 'NONE';
    
    if (mode === 'WITHDRAW') {
        if (entryMethod === 'BUNDLE') {
            const wB = parseInt(withdrawBooklets);
            if (!isNaN(wB) && wB > 0) {
                qty = wB * config.bundleSize;
                type = 'WITHDRAW';
            }
        } else {
            const wS = parseInt(withdrawStart);
            const wE = parseInt(withdrawEnd);
            if (!isNaN(wS) && !isNaN(wE) && wE >= wS) {
                qty = wE - wS + 1;
                type = 'WITHDRAW';
            }
        }
    } else {
        if (entryMethod === 'BUNDLE') {
            const iB = parseInt(issueBooklets);
            if (!isNaN(iB) && iB > 0) {
                qty = iB * config.bundleSize;
                type = 'ISSUE';
            }
        } else {
            const iS = parseInt(issueStart);
            const iE = parseInt(issueEnd);
            if (!isNaN(iS) && !isNaN(iE) && iE >= iS) {
                qty = iE - iS + 1;
                type = 'ISSUE';
            }
        }
    }

    setLivePreview({
      qty,
      amount: qty * config.faceValue,
      type
    });
  }, [issueBooklets, issueStart, issueEnd, withdrawBooklets, withdrawStart, withdrawEnd, config, mode, entryMethod]);

  // Filter Transactions for Table
  const todayTransactions = entries
    .filter(e => e.date === currentDate && e.type === mode && e.status !== 'Inactive')
    .sort((a, b) => b.timestamp - a.timestamp);

  const totalAmount = todayTransactions.reduce((sum, e) => sum + e.amount, 0);

  const formatCurrency = (val: number) => `₹${val.toLocaleString()}`;

  const handleTransaction = () => {
    const isIssue = mode === 'ISSUE';
    const notes = isIssue ? issueNotes : withdrawNotes;

    let qty = 0;
    let finalStart: number | undefined = undefined;
    let finalEnd: number | undefined = undefined;

    if (entryMethod === 'BUNDLE') {
        const bookletsStr = isIssue ? issueBooklets : withdrawBooklets;
        const booklets = parseInt(bookletsStr);
        if (isNaN(booklets) || booklets <= 0) {
            alert("Please enter a valid booklet count.");
            return;
        }
        qty = booklets * config.bundleSize;
    } else {
        const startStr = isIssue ? issueStart : withdrawStart;
        const endStr = isIssue ? issueEnd : withdrawEnd;
        const start = parseInt(startStr);
        const end = parseInt(endStr);
        
        if (isNaN(start) || isNaN(end) || end < start) {
            alert("Please enter a valid serial range.");
            return;
        }
        qty = end - start + 1;
        finalStart = start;
        finalEnd = end;
    }

    const entryData = {
        type: mode,
        couponType: selectedCoupon,
        quantity: qty,
        faceValue: config.faceValue,
        amount: qty * config.faceValue,
        serialStart: finalStart,
        serialEnd: finalEnd,
        entryMode: entryMethod,
        notes
    };

    if (editingEntry) {
        updateExistingEntry({ ...editingEntry, ...entryData });
    } else {
        addEntry(entryData);
    }

    // Clear inputs
    if (isIssue) {
      setIssueBooklets(""); setIssueStart(""); setIssueEnd(""); setIssueNotes("");
    } else {
      setWithdrawBooklets(""); setWithdrawStart(""); setWithdrawEnd(""); setWithdrawNotes("");
    }
  };

  const handleKeypadClick = (val: number | 'BACKSPACE') => {
    const isIssue = mode === 'ISSUE';
    const currentStart = isIssue ? issueStart : withdrawStart;
    
    let newStart = "";
    if (val === 'BACKSPACE') {
      newStart = currentStart.slice(0, -1);
    } else {
      newStart = currentStart + val.toString();
    }

    // Calculate end immediately to avoid effect chain lag
    let newEnd = "";
    if (newStart && entryMethod === 'SERIAL') {
       const s = parseInt(newStart);
       if (!isNaN(s)) {
          if (isIssue) {
             // Issue: Default to full bundle
             newEnd = (s + config.bundleSize - 1).toString();
          } else {
             // Withdraw: Snap to end of bundle (remainder logic)
             newEnd = (Math.ceil(s / config.bundleSize) * config.bundleSize).toString();
          }
       }
    }

    // Batch update both start and end to reduce render cycles
    if (isIssue) {
      setIssueStart(newStart);
      setIssueEnd(newEnd);
    } else {
      setWithdrawStart(newStart);
      setWithdrawEnd(newEnd);
    }
  };

  return (
    <div className="flex flex-col gap-6 mb-6">
      
      {/* FORM CARD */}
      <div className={`bg-white rounded-xl shadow-sm border ${mode === 'ISSUE' ? 'border-emerald-200' : 'border-rose-200'} overflow-hidden relative`}>
        {editingEntry && (
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400 z-10 animate-pulse"></div>
        )}
        <div className={`${mode === 'ISSUE' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'} px-4 py-3 border-b border-opacity-20 flex justify-between items-center`}>
          <h3 className="font-bold flex items-center gap-2">
            {mode === 'ISSUE' ? <ArrowRight size={18}/> : <ArrowRight size={18} className="rotate-180"/>} 
            {editingEntry ? `Editing ${mode}` : `${mode === 'ISSUE' ? 'Issue' : 'Withdraw'} Coupons`}
          </h3>
          {editingEntry && (
              <button onClick={cancelEditing} className="text-xs font-bold flex items-center gap-1 bg-white/50 px-2 py-1 rounded hover:bg-white text-slate-600">
                  <XCircle size={14}/> Cancel Edit
              </button>
          )}
        </div>
        <div className="p-4 md:p-6 space-y-6">
          
          {children && (
            <div className="pb-4 border-b border-slate-100">
                {children}
            </div>
          )}

          {/* Entry Method Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
                onClick={() => setEntryMethod('SERIAL')}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${entryMethod === 'SERIAL' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Hash size={16}/> Serial Numbers
            </button>
            <button 
                onClick={() => setEntryMethod('BUNDLE')}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${entryMethod === 'BUNDLE' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Layers size={16}/> Booklets
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 min-h-[100px]">
            {entryMethod === 'BUNDLE' ? (
                <div className="animate-fade-in">
                    <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1"><Layers size={16}/> Booklets Count</label>
                    <input 
                        type="number" 
                        value={mode === 'ISSUE' ? issueBooklets : withdrawBooklets} 
                        onChange={e=> mode === 'ISSUE' ? setIssueBooklets(e.target.value) : setWithdrawBooklets(e.target.value)} 
                        className="w-full input-field" 
                        placeholder="e.g. 5" 
                    />
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
                    <div className="flex-1">
                        <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1"><Hash size={16}/> Serial Start</label>
                        <input 
                            type="number" 
                            value={mode === 'ISSUE' ? issueStart : withdrawStart} 
                            onChange={e=> mode === 'ISSUE' ? setIssueStart(e.target.value) : setWithdrawStart(e.target.value)} 
                            className="w-full input-field" 
                            placeholder="e.g. 1001" 
                        />
                        {/* Vibrant Numeric Keypad Row */}
                        <div className="flex gap-1 mt-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleKeypadClick(num)}
                                    className={`flex-1 h-10 font-bold rounded-lg border text-lg shadow-sm transition-transform active:scale-95 ${DIGIT_STYLES[num]}`}
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => handleKeypadClick('BACKSPACE')}
                                className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg border border-slate-300 flex items-center justify-center shadow-sm transition-transform active:scale-95"
                            >
                                <Delete size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1"><Hash size={16}/> Serial End</label>
                        <input 
                            type="number" 
                            value={mode === 'ISSUE' ? issueEnd : withdrawEnd} 
                            onChange={e=> mode === 'ISSUE' ? setIssueEnd(e.target.value) : setWithdrawEnd(e.target.value)} 
                            className="w-full input-field" 
                            placeholder="e.g. 1500" 
                        />
                    </div>
                </div>
            )}
          </div>
          
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">Notes</label>
            <input 
                type="text" 
                value={mode === 'ISSUE' ? issueNotes : withdrawNotes} 
                onChange={e=> mode === 'ISSUE' ? setIssueNotes(e.target.value) : setWithdrawNotes(e.target.value)}
                className="w-full input-field" 
                placeholder="Optional notes" 
            />
          </div>

          <div className="flex flex-col gap-3">
             <button 
                onClick={handleTransaction} 
                className={`w-full btn-primary flex items-center justify-center gap-2 ${editingEntry ? 'bg-yellow-600 hover:bg-yellow-700' : (mode === 'ISSUE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700')}`}
             >
                {editingEntry ? <Edit2 size={18}/> : null}
                {editingEntry ? 'Update Entry' : (mode === 'ISSUE' ? 'Confirm Issue' : 'Confirm Withdraw')}
             </button>

             {/* Delete Last Entry Button */}
             {!editingEntry && (
                 <button 
                    type="button"
                    onClick={() => {
                        if(window.confirm("Move the LAST entry to Inactive Table? It will be removed from active calculations.")) {
                            deleteLastEntry();
                        }
                    }}
                    className="w-full py-3 rounded-lg font-bold text-slate-500 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors flex items-center justify-center gap-2"
                 >
                    <Trash2 size={16} /> Delete Last Entry
                 </button>
             )}
          </div>
        </div>
      </div>

      {/* LIVE PREVIEW CARD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
           <h3 className="font-bold text-slate-800 flex items-center gap-2"><Calculator size={18}/> Live Preview</h3>
        </div>
        <div className="p-6 flex-1 flex flex-col justify-center items-center text-center">
          {livePreview.qty > 0 ? (
             <div className={`space-y-6 ${livePreview.type === 'WITHDRAW' ? 'text-rose-600' : 'text-emerald-600'}`}>
                <div>
                   <div className="text-sm font-bold text-slate-500 uppercase tracking-wide">Quantity</div>
                   <div className="text-4xl md:text-5xl font-extrabold mt-1">{livePreview.qty.toLocaleString()}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 md:gap-8 text-left">
                     <div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Coupon</div>
                        <div className="text-lg font-bold text-slate-800">{selectedCoupon}</div>
                     </div>
                     <div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Face Value</div>
                        <div className="text-lg font-bold text-slate-800">₹{config.faceValue}</div>
                     </div>
                </div>
                <div className="pt-6 border-t border-dashed border-slate-300 w-full">
                   <div className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Amount</div>
                   <div className="text-4xl md:text-6xl font-extrabold mt-2 break-all">₹{livePreview.amount.toLocaleString()}</div>
                </div>
             </div>
          ) : (
            <div className="text-slate-400 flex flex-col items-center">
              <span className="text-sm">Enter values to see calculation</span>
            </div>
          )}
        </div>
      </div>

      {/* TODAY'S TRANSACTIONS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    {mode === 'ISSUE' ? 'Today\'s Issues' : 'Today\'s Withdrawals'}
                </h3>
                <div className="bg-white px-3 py-1 rounded border border-slate-200 shadow-sm">
                    <span className="text-xs font-bold text-slate-500 uppercase mr-2">Total</span>
                    <span className={`text-lg font-bold ${mode === 'ISSUE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(totalAmount)}
                    </span>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-2 whitespace-nowrap">Time</th>
                            <th className="px-4 py-2 whitespace-nowrap">Coupon</th>
                            <th className="px-4 py-2 whitespace-nowrap">Serial Range</th>
                            <th className="px-4 py-2 text-right whitespace-nowrap">Qty</th>
                            <th className="px-4 py-2 text-right whitespace-nowrap">Amount</th>
                            <th className="px-4 py-2 text-center whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {todayTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                                    No {mode === 'ISSUE' ? 'issues' : 'withdrawals'} recorded today.
                                </td>
                            </tr>
                        ) : (
                            todayTransactions.map(entry => (
                                <tr key={entry.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2 text-slate-500 text-xs">
                                        {new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </td>
                                    <td className="px-4 py-2 font-medium text-slate-700">
                                        {entry.couponType}
                                        {entry.entryMode === 'BUNDLE' && <span className="ml-1 text-xs text-slate-400">(Bundle)</span>}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600 font-mono text-xs">
                                        {entry.serialStart ? `${entry.serialStart} - ${entry.serialEnd}` : '-'}
                                    </td>
                                    <td className="px-4 py-2 text-right text-slate-700">{entry.quantity}</td>
                                    <td className="px-4 py-2 text-right font-bold text-slate-800">{formatCurrency(entry.amount)}</td>
                                    <td className="px-4 py-2 flex justify-center gap-2">
                                        <button 
                                            onClick={() => startEditing(entry)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Edit"
                                        >
                                            <Edit size={14}/>
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if(window.confirm("Are you sure you want to delete this entry?")) {
                                                    deleteEntryById(entry.id);
                                                }
                                            }}
                                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={14}/>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
       </div>

    </div>
  );
};

export default TransactionPanel;