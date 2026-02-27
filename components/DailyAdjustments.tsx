import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Briefcase, CreditCard, Wallet, Edit2, XCircle, Delete, Trash2, Edit } from 'lucide-react';

interface DailyAdjustmentsProps {
  mode: 'COST' | 'CARD' | 'PAYTM';
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

// Helper for keypad click
const handleKeypadClick = (currentVal: string, setVal: (v: string) => void, val: number | 'BACKSPACE') => {
  if (val === 'BACKSPACE') {
      setVal(currentVal.slice(0, -1));
  } else {
      setVal(currentVal + val.toString());
  }
};

// Input Component with Integrated Keypad
const InputWithKeypad = ({ 
    value, 
    setValue,
    placeholder, 
    label 
}: { value: string, setValue: (v: string) => void, placeholder: string, label: string }) => (
  <div className="flex-1 mb-4">
      <label className="block text-sm font-bold text-slate-700 mb-1">
          {label}
      </label>
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <input 
              type="tel"
              inputMode="decimal" 
              value={value} 
              onChange={(e) => setValue(e.target.value)}
              className="input-field w-full text-lg mb-3" 
              placeholder={placeholder} 
          />
          
          {/* INLINE KEYPAD */}
          <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                  <button
                      key={num}
                      type="button"
                      onClick={() => handleKeypadClick(value, setValue, num)}
                      className={`flex-1 min-w-[36px] h-12 font-bold rounded-lg border text-lg shadow-sm transition-transform active:scale-95 ${DIGIT_STYLES[num]}`}
                  >
                      {num}
                  </button>
              ))}
              <button
                  type="button"
                  onClick={() => handleKeypadClick(value, setValue, 'BACKSPACE')}
                  className="flex-1 min-w-[36px] h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg border border-slate-300 flex items-center justify-center shadow-sm transition-transform active:scale-95"
              >
                  <Delete size={20} />
              </button>
          </div>
      </div>
  </div>
);

const DailyAdjustments: React.FC<DailyAdjustmentsProps> = ({ mode }) => {
  const { addEntry, editingEntry, updateExistingEntry, cancelEditing, entries, currentDate, deleteEntryById, startEditing } = useApp();
  
  const [labour, setLabour] = useState("");
  const [material, setMaterial] = useState(""); // Internal var stays 'material' for DB consistency, Label is 'Milk'
  
  const [cardCash, setCardCash] = useState("");
  const [cardPhone, setCardPhone] = useState("");
  const [couponPaytm, setCouponPaytm] = useState("");

  // Load Edit Data
  useEffect(() => {
    if (editingEntry) {
        if (mode === 'COST' && editingEntry.type === 'DAILY_COST') {
            setLabour(editingEntry.labourCost ? editingEntry.labourCost.toString() : "");
            setMaterial(editingEntry.materialCost ? editingEntry.materialCost.toString() : "");
        }
        else if (mode === 'CARD') {
            if (editingEntry.type === 'CARD_CASH') {
                setCardCash(editingEntry.amount.toString());
            }
            if (editingEntry.type === 'CARD_PHONEPE') {
                setCardPhone(editingEntry.amount.toString());
            }
        }
        else if (mode === 'PAYTM' && editingEntry.type === 'COUPON_PAYTM') {
            setCouponPaytm(editingEntry.amount.toString());
        }
    } else {
        setLabour(""); setMaterial(""); setCardCash(""); setCardPhone(""); setCouponPaytm("");
    }
  }, [editingEntry, mode]);


  const handleCost = () => {
    const l = parseFloat(labour) || 0;
    const m = parseFloat(material) || 0;
    if (l === 0 && m === 0) {
        alert("Please enter a value for Labour or Milk.");
        return;
    }
    
    if (editingEntry) {
        updateExistingEntry({ ...editingEntry, labourCost: l, materialCost: m, amount: 0 });
    } else {
        addEntry({
            type: 'DAILY_COST',
            amount: 0,
            labourCost: l,
            materialCost: m, // Saving as materialCost in DB
            notes: "Daily Costs"
        });
    }
    setLabour(""); setMaterial("");
  };

  const handleCardCash = () => {
    const v = parseFloat(cardCash);
    if (!v) { alert("Please enter amount."); return; }

    if (editingEntry) {
        updateExistingEntry({ ...editingEntry, amount: v });
    } else {
        addEntry({ type: 'CARD_CASH', amount: v, notes: "Card Cash Entry" });
    }
    setCardCash("");
  };

  const handleCardPhone = () => {
    const v = parseFloat(cardPhone);
    if (!v) { alert("Please enter amount."); return; }

    if (editingEntry) {
        updateExistingEntry({ ...editingEntry, amount: v });
    } else {
        addEntry({ type: 'CARD_PHONEPE', amount: v, notes: "PhonePe Entry" });
    }
    setCardPhone("");
  };

  const handleCouponPaytm = () => {
    const v = parseFloat(couponPaytm);
    if (!v) { alert("Please enter amount."); return; }

    if (editingEntry) {
        updateExistingEntry({ ...editingEntry, amount: v });
    } else {
        addEntry({ type: 'COUPON_PAYTM', amount: v, notes: "Paytm Entry" });
    }
    setCouponPaytm("");
  };

  // Filter Today's Entries for the Table
  const todayEntries = entries.filter(e => {
      if (e.date !== currentDate || e.status === 'Inactive') return false;
      if (mode === 'COST') return e.type === 'DAILY_COST';
      if (mode === 'CARD') return e.type === 'CARD_CASH' || e.type === 'CARD_PHONEPE';
      if (mode === 'PAYTM') return e.type === 'COUPON_PAYTM';
      return false;
  }).sort((a, b) => b.timestamp - a.timestamp);

  const totalAmount = todayEntries.reduce((sum, e) => {
      if (e.type === 'DAILY_COST') return sum + (e.labourCost || 0) + (e.materialCost || 0);
      return sum + e.amount;
  }, 0);

  const formatCurrency = (val: number) => `₹${val.toLocaleString()}`;

  const getDetails = (e: any) => {
      if (e.type === 'DAILY_COST') {
          const parts = [];
          if (e.labourCost) parts.push(`Labour: ₹${e.labourCost}`);
          if (e.materialCost) parts.push(`Milk: ₹${e.materialCost}`);
          return parts.join(', ');
      }
      return e.notes || e.type.replace('_', ' ');
  };

  const getTypeLabel = (e: any) => {
       if (e.type === 'DAILY_COST') return 'Daily Cost';
       if (e.type === 'CARD_CASH') return 'Card (Cash)';
       if (e.type === 'CARD_PHONEPE') return 'Card (PhonePe)';
       if (e.type === 'COUPON_PAYTM') return 'Paytm';
       return e.type;
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 pb-8">
      
      {editingEntry && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded flex justify-between items-center text-yellow-800 animate-fade-in">
              <span className="font-bold flex items-center gap-2"><Edit2 size={16}/> Editing Entry...</span>
              <button onClick={cancelEditing} className="text-sm underline flex items-center gap-1"><XCircle size={14}/> Cancel</button>
          </div>
      )}

      {/* INPUT SECTIONS */}
      {mode === 'COST' && (
      <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
        <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Briefcase className="text-rose-600"/> Daily Operational Costs</h4>
        <div className="space-y-2">
          <InputWithKeypad key="labour" value={labour} setValue={setLabour} label="Labour Cost (₹)" placeholder="0.00" />
          <InputWithKeypad key="material" value={material} setValue={setMaterial} label="Milk (₹)" placeholder="0.00" />
          <button onClick={handleCost} className={`btn-secondary w-full text-white py-3 text-lg mt-2 ${editingEntry ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
             {editingEntry ? 'Update Costs' : 'Save Costs'}
          </button>
        </div>
      </div>
      )}

      {mode === 'CARD' && (
      <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
        <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><CreditCard className="text-sky-600"/> Card Sales Entry</h4>
        <div className="space-y-6">
          {(!editingEntry || editingEntry.type === 'CARD_CASH') && (
            <div>
                <InputWithKeypad key="cardCash" value={cardCash} setValue={setCardCash} label="Card Cash (₹)" placeholder="Amount" />
                <button onClick={handleCardCash} className={`w-full text-white py-3 rounded-md font-bold shadow-sm ${editingEntry ? 'bg-yellow-600' : 'bg-sky-600'}`}>
                    {editingEntry ? 'Update' : 'Add Card Cash'}
                </button>
            </div>
          )}
          {(!editingEntry || editingEntry.type === 'CARD_PHONEPE') && (
            <div>
                <InputWithKeypad key="cardPhone" value={cardPhone} setValue={setCardPhone} label="PhonePe / UPI (₹)" placeholder="Amount" />
                <button onClick={handleCardPhone} className={`w-full text-white py-3 rounded-md font-bold shadow-sm ${editingEntry ? 'bg-yellow-600' : 'bg-sky-600'}`}>
                    {editingEntry ? 'Update' : 'Add PhonePe'}
                </button>
            </div>
          )}
        </div>
      </div>
      )}

      {mode === 'PAYTM' && (
      <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
        <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Wallet className="text-sky-600"/> Coupon Paytm Entry</h4>
        <div className="p-4 bg-sky-50 rounded-lg border border-sky-100">
             <InputWithKeypad key="couponPaytm" value={couponPaytm} setValue={setCouponPaytm} label="Paytm Received Amount (₹)" placeholder="Amount" />
             <button onClick={handleCouponPaytm} className={`w-full text-white py-3 rounded-md font-bold shadow-sm ${editingEntry ? 'bg-yellow-600' : 'bg-sky-600'}`}>
                {editingEntry ? 'Update' : 'Add Paytm'}
            </button>
        </div>
      </div>
      )}

      {/* TODAY'S ENTRIES TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col mt-4">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Today's Entries</h3>
                <div className="bg-white px-3 py-1 rounded border border-slate-200 shadow-sm">
                    <span className="text-xs font-bold text-slate-500 uppercase mr-2">Total</span>
                    <span className="text-lg font-bold text-slate-700">{formatCurrency(totalAmount)}</span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-2 whitespace-nowrap">Time</th>
                            <th className="px-4 py-2 whitespace-nowrap">Type</th>
                            <th className="px-4 py-2 whitespace-nowrap">Details</th>
                            <th className="px-4 py-2 text-right whitespace-nowrap">Amount</th>
                            <th className="px-4 py-2 text-center whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {todayEntries.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                                    No entries recorded today.
                                </td>
                            </tr>
                        ) : (
                            todayEntries.map(entry => (
                                <tr key={entry.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2 text-slate-500 text-xs">
                                        {new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </td>
                                    <td className="px-4 py-2 font-medium text-slate-700">
                                        {getTypeLabel(entry)}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600 text-xs">
                                        {getDetails(entry)}
                                    </td>
                                    <td className="px-4 py-2 text-right font-bold text-slate-800">
                                        {formatCurrency(entry.type === 'DAILY_COST' ? ((entry.labourCost||0) + (entry.materialCost||0)) : entry.amount)}
                                    </td>
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

export default DailyAdjustments;