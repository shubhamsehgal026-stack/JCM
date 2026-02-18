import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowDownToLine, Calendar, RefreshCw, Wallet, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

const OpeningBalancePanel: React.FC = () => {
  const { addEntry, setStatusMessage, currentDate, entries } = useApp();
  const [openingBalance, setOpeningBalance] = useState("");
  
  // Check for existing opening balance for the current date
  const existingOpeningEntry = entries.find(
    e => e.type === 'OPENING' && e.date === currentDate && e.status !== 'Inactive'
  );

  // Helper to safely calculate previous date from YYYY-MM-DD string
  const getPreviousDate = (dateStr: string) => {
     const d = new Date(dateStr);
     d.setDate(d.getDate() - 1);
     return d.toISOString().split('T')[0];
  };

  // Default source date to Yesterday relative to the currently selected App Date
  const [sourceDate, setSourceDate] = useState(() => getPreviousDate(currentDate));

  // Sync sourceDate whenever the global currentDate changes
  useEffect(() => {
    setSourceDate(getPreviousDate(currentDate));
  }, [currentDate]);

  const handlePrevDay = () => {
    const d = new Date(sourceDate);
    d.setDate(d.getDate() - 1);
    setSourceDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(sourceDate);
    d.setDate(d.getDate() + 1);
    setSourceDate(d.toISOString().split('T')[0]);
  };

  const handleSaveOpening = () => {
    const amount = parseFloat(openingBalance);
    if (isNaN(amount)) return;
    addEntry({
      type: 'OPENING',
      amount: amount,
      notes: "Manual Opening Balance"
    });
    setOpeningBalance("");
  };

  const handleFetchClosing = () => {
    // FETCH LOGIC CHANGED: Now fetches the Total Withdrawals from the source date
    const totalWithdrawals = entries
      .filter(e => e.date === sourceDate && e.type === 'WITHDRAW' && e.status !== 'Inactive')
      .reduce((sum, e) => sum + e.amount, 0);

    setOpeningBalance(totalWithdrawals.toString());
    setStatusMessage(`Fetched total withdrawals from ${sourceDate}: ₹${totalWithdrawals}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-4 md:p-8 rounded-xl shadow-md border border-slate-200">
        <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Wallet className="text-sky-600"/> Opening Balance Management
        </h4>
        
        {/* Notification if Opening Balance Exists */}
        {existingOpeningEntry && (
             <div className="mb-6 bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3 animate-fade-in">
                 <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
                 <div>
                     <h5 className="font-bold text-rose-800 text-sm">Opening Balance Already Set</h5>
                     <p className="text-rose-600 text-sm mt-1">
                         An opening balance of <span className="font-bold">₹{existingOpeningEntry.amount.toLocaleString()}</span> is already recorded for today ({currentDate}). 
                         Adding another entry will add to this amount.
                     </p>
                 </div>
             </div>
        )}

        <div className="space-y-8">
          
          {/* Fetch Section */}
          <div className="p-4 md:p-6 bg-slate-50 rounded-lg border border-slate-200">
             <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
               <RefreshCw size={16}/> Fetch from Previous Day
             </h3>
             <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
               <div className="flex-1">
                 <label className="block text-xs font-bold text-slate-500 mb-1">Select Date</label>
                 
                 <div className="flex items-center gap-2">
                   <button 
                      onClick={handlePrevDay}
                      className="p-2.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors shadow-sm"
                      title="Previous Day"
                   >
                      <ChevronLeft size={18}/>
                   </button>
                   
                   <div className="relative flex-1">
                     <Calendar size={18} className="absolute left-3 top-3 text-slate-400 pointer-events-none"/>
                     <input 
                       type="date" 
                       value={sourceDate}
                       onChange={(e) => setSourceDate(e.target.value)}
                       className="w-full !pl-10 input-field cursor-pointer font-bold text-slate-700"
                     />
                   </div>

                   <button 
                      onClick={handleNextDay}
                      className="p-2.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors shadow-sm"
                      title="Next Day"
                   >
                      <ChevronRight size={18}/>
                   </button>
                 </div>

               </div>
               <button 
                 onClick={handleFetchClosing}
                 className="w-full sm:w-auto bg-white border border-slate-300 text-slate-700 hover:text-sky-600 hover:border-sky-300 px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm h-[42px]"
               >
                 Fetch Withdrawals
               </button>
             </div>
             <p className="text-xs text-slate-400 mt-2">
               Fetches the Total Withdrawals amount from the selected date.
             </p>
          </div>

          {/* Set Section */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Opening Amount (₹)</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="number"
                placeholder="0.00"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="flex-1 input-field text-lg"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveOpening()}
              />
              <button
                onClick={handleSaveOpening}
                className="w-full sm:w-auto justify-center bg-sky-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-sky-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <ArrowDownToLine size={20} /> Set Opening
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Setting this will add an 'OPENING' entry for the current date.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OpeningBalancePanel;