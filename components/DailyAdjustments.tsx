import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Briefcase, CreditCard, Wallet, Edit2, XCircle, Delete } from 'lucide-react';

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

const DailyAdjustments: React.FC<DailyAdjustmentsProps> = ({ mode }) => {
  const { addEntry, editingEntry, updateExistingEntry, cancelEditing } = useApp();
  
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
                type="number" 
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
                        className={`flex-1 min-w-[36px] h-10 font-bold rounded-lg border text-lg shadow-sm transition-transform active:scale-95 ${DIGIT_STYLES[num]}`}
                    >
                        {num}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => handleKeypadClick(value, setValue, 'BACKSPACE')}
                    className="flex-1 min-w-[36px] h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg border border-slate-300 flex items-center justify-center shadow-sm transition-transform active:scale-95"
                >
                    <Delete size={20} />
                </button>
            </div>
        </div>
    </div>
  );

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
          <InputWithKeypad value={labour} setValue={setLabour} label="Labour Cost (₹)" placeholder="0.00" />
          <InputWithKeypad value={material} setValue={setMaterial} label="Milk (₹)" placeholder="0.00" />
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
                <InputWithKeypad value={cardCash} setValue={setCardCash} label="Card Cash (₹)" placeholder="Amount" />
                <button onClick={handleCardCash} className={`w-full text-white py-3 rounded-md font-bold shadow-sm ${editingEntry ? 'bg-yellow-600' : 'bg-sky-600'}`}>
                    {editingEntry ? 'Update' : 'Add Card Cash'}
                </button>
            </div>
          )}
          {(!editingEntry || editingEntry.type === 'CARD_PHONEPE') && (
            <div>
                <InputWithKeypad value={cardPhone} setValue={setCardPhone} label="PhonePe / UPI (₹)" placeholder="Amount" />
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
             <InputWithKeypad value={couponPaytm} setValue={setCouponPaytm} label="Paytm Received Amount (₹)" placeholder="Amount" />
             <button onClick={handleCouponPaytm} className={`w-full text-white py-3 rounded-md font-bold shadow-sm ${editingEntry ? 'bg-yellow-600' : 'bg-sky-600'}`}>
                {editingEntry ? 'Update' : 'Add Paytm'}
            </button>
        </div>
      </div>
      )}

    </div>
  );
};

export default DailyAdjustments;