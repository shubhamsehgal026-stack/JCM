import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EntryType, CashEntry } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer, Edit, CheckSquare, RotateCcw, Ban, Share2 } from 'lucide-react';
import { FOOTER_TEXT } from '../constants';

const formatCurrency = (val: number) => `₹${val.toLocaleString()}`;

const SummaryDashboard: React.FC = () => {
  const { entries, currentDate, aggregates, deleteEntryById, restoreEntryById, startEditing } = useApp();
  const [isModifyMode, setIsModifyMode] = useState(false);

  // Filter: Date only (Show both Active and Inactive)
  const todayEntries = entries
    .filter(e => e.date === currentDate)
    .sort((a, b) => b.timestamp - a.timestamp);

  const getEntryDescription = (e: CashEntry) => {
    if (e.type === 'DAILY_COST') return `Labour: ${e.labourCost}, Milk: ${e.materialCost}`;
    if (e.couponType) {
        if (e.entryMode === 'BUNDLE') return `${e.couponType} (${e.quantity! / (e.quantity!/e.quantity!)} Booklets)`;
        return `${e.couponType}`;
    }
    return e.notes || e.type;
  };
  
  const getEntryValue = (e: CashEntry) => {
    if (e.type === 'DAILY_COST') return (e.labourCost || 0) + (e.materialCost || 0);
    return e.amount;
  };

  const generatePDFDoc = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(225, 29, 72); // Rose-600
    doc.text("Jalpan Services - Coupon/Card Details", 14, 20);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Date: ${currentDate}`, 14, 28);
    
    // Totals Table
    const totalsData = [
      ["Total Coupon Sales", formatCurrency(aggregates.totalCouponSales)],
      ["Total Card Sales", formatCurrency(aggregates.totalCardSales)],
      ["Total Sales", formatCurrency(aggregates.totalSales)],
      ["Coupon Paytm", formatCurrency(aggregates.couponPaytm)],
      ["Costs (Labour+Milk)", formatCurrency(aggregates.labour + aggregates.material)],
      ["Coupon Cash Closing", formatCurrency(aggregates.couponCashClosing)],
      ["Total Cash Deposit", formatCurrency(aggregates.totalCashDeposit)],
    ];
    
    autoTable(doc, {
      startY: 35,
      head: [['Metric', 'Amount']],
      body: totalsData,
      theme: 'grid',
      headStyles: { fillColor: [14, 165, 233] } // Sky-500
    });

    // Entries Table (Active Only recommended for Report)
    const activeEntries = todayEntries.filter(e => e.status !== 'Inactive');
    const tableData = activeEntries.map(e => [
      e.type,
      e.couponType || "-",
      e.serialStart ? `${e.serialStart}-${e.serialEnd}` : "-",
      e.quantity || "-",
      formatCurrency(getEntryValue(e))
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Type', 'Coupon', 'Serial', 'Qty', 'Amount']],
      body: tableData,
    });

    doc.setFontSize(10);
    doc.text(FOOTER_TEXT, 14, doc.internal.pageSize.height - 10);
    
    return doc;
  };

  const exportPDF = () => {
    const doc = generatePDFDoc();
    doc.save(`Report_${currentDate}.pdf`);
  };

  const handleShare = async () => {
    try {
      const doc = generatePDFDoc();
      const blob = doc.output('blob');
      const file = new File([blob], `Report_${currentDate}.pdf`, { type: 'application/pdf' });

      // Check for Web Share API support with files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Jalpan Daily Report',
          text: `Daily Report for ${currentDate}`,
        });
      } else {
        // Fallback
        alert("Sharing is not supported on this device. Downloading PDF instead.");
        exportPDF();
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Don't alert if user cancelled the share
      if ((error as Error).name !== 'AbortError') {
        alert("Failed to share report.");
      }
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      
      {/* TOTALS GRID */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4 uppercase tracking-wider text-xs md:text-sm border-b border-slate-100 pb-2">Financial Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 text-sm">
          <StatBox label="Coupon Sales" value={aggregates.totalCouponSales} color="emerald" />
          <StatBox label="Card Sales" value={aggregates.totalCardSales} color="emerald" />
          <StatBox label="Card Cash" value={aggregates.cardCash} />
          <StatBox label="Card PhonePe" value={aggregates.cardPhonePe} />
          <StatBox label="Total Sales" value={aggregates.totalSales} color="sky" bold />
          
          <StatBox label="Coupon Paytm" value={aggregates.couponPaytm} color="sky" />
          <StatBox label="Labour Cost" value={aggregates.labour} color="rose" />
          <StatBox label="Milk" value={aggregates.material} color="rose" />
          
          <StatBox label="Coupon Cash Closing" value={aggregates.couponCashClosing} color="auto" bold />
          <StatBox label="Total Cash Deposit" value={aggregates.totalCashDeposit} color="auto" bold />
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-100 p-3 rounded-lg border border-slate-200 gap-3">
         <div className="text-slate-500 font-medium text-sm">
             Actions
         </div>
         <div className="flex flex-wrap gap-3 w-full sm:w-auto">
             <button 
                onClick={() => setIsModifyMode(!isModifyMode)}
                className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded transition text-sm font-medium border ${isModifyMode ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-white text-slate-600 border-slate-300'}`}
             >
                 {isModifyMode ? <CheckSquare size={16}/> : <Edit size={16}/>}
                 {isModifyMode ? 'Done' : 'Modify'}
             </button>

             <button onClick={handleShare} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition text-sm font-medium border border-green-200">
                 <Share2 size={16} /> Share Report
             </button>

             <button onClick={exportPDF} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-sky-100 text-sky-700 rounded hover:bg-sky-200 transition text-sm font-medium border border-sky-200">
                 <Printer size={16} /> Print PDF
             </button>
         </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                {isModifyMode && <th className="px-4 py-3 whitespace-nowrap w-32">Actions</th>}
                <th className="px-4 md:px-6 py-3 whitespace-nowrap">Status</th>
                <th className="px-4 md:px-6 py-3 whitespace-nowrap">Type</th>
                <th className="px-4 md:px-6 py-3 whitespace-nowrap">Details</th>
                <th className="px-4 md:px-6 py-3 whitespace-nowrap">Serial Range</th>
                <th className="px-4 md:px-6 py-3 text-right whitespace-nowrap">Quantity</th>
                <th className="px-4 md:px-6 py-3 text-right whitespace-nowrap">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todayEntries.length === 0 ? (
                <tr>
                    <td colSpan={isModifyMode ? 7 : 6} className="px-6 py-8 text-center text-slate-400 italic">No entries for this date.</td>
                </tr>
              ) : (
                todayEntries.map((entry) => {
                  const isInactive = entry.status === 'Inactive';
                  return (
                    <tr key={entry.id} className={`hover:bg-slate-50 ${isInactive ? 'opacity-50 bg-slate-50' : ''}`}>
                        {isModifyMode && (
                            <td className="px-4 py-3 flex items-center gap-2">
                                <button 
                                    type="button"
                                    onClick={() => startEditing(entry)}
                                    className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 border border-blue-200" title="Edit"
                                >
                                    <Edit size={14}/>
                                </button>
                                {isInactive ? (
                                    <button 
                                        type="button"
                                        onClick={() => restoreEntryById(entry.id)}
                                        className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 text-xs px-2 font-bold" title="Make Active"
                                    >
                                        <RotateCcw size={14}/> Active
                                    </button>
                                ) : (
                                    <button 
                                        type="button"
                                        onClick={() => deleteEntryById(entry.id)}
                                        className="p-1.5 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 border border-rose-200 flex items-center gap-1 text-xs px-2 font-bold" title="Make Inactive"
                                    >
                                        <Ban size={14}/> Inactive
                                    </button>
                                )}
                            </td>
                        )}
                        <td className="px-4 md:px-6 py-3 font-medium whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-xs border ${isInactive ? 'bg-slate-100 text-slate-500 border-slate-300' : 'bg-green-100 text-green-700 border-green-200'}`}>
                                {entry.status || 'Active'}
                            </span>
                        </td>
                        <td className="px-4 md:px-6 py-3 font-medium text-slate-900 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-xs ${getBadgeColor(entry.type)}`}>
                                {entry.type}
                            </span>
                        </td>
                        <td className="px-4 md:px-6 py-3 text-slate-600 min-w-[150px]">{getEntryDescription(entry)}</td>
                        <td className="px-4 md:px-6 py-3 text-slate-500 font-mono whitespace-nowrap">
                            {entry.serialStart ? `${entry.serialStart} - ${entry.serialEnd}` : '-'}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-right text-slate-900 whitespace-nowrap">{entry.quantity || '-'}</td>
                        <td className="px-4 md:px-6 py-3 text-right font-bold text-slate-800 whitespace-nowrap">
                            {isInactive ? <span className="line-through text-slate-400">{formatCurrency(getEntryValue(entry))}</span> : formatCurrency(getEntryValue(entry))}
                        </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const getBadgeColor = (type: EntryType) => {
    switch(type) {
        case 'ISSUE': return 'bg-emerald-100 text-emerald-800';
        case 'WITHDRAW': return 'bg-rose-100 text-rose-800';
        case 'OPENING': return 'bg-sky-100 text-sky-800';
        case 'DAILY_COST': return 'bg-amber-100 text-amber-800';
        default: return 'bg-slate-100 text-slate-800';
    }
}

const StatBox = ({ label, value, color = "gray", bold = false }: { label: string, value: number, color?: string, bold?: boolean }) => {
  let textColor = "text-slate-900";
  if (color === "emerald") textColor = "text-emerald-600";
  if (color === "red" || color === "rose") textColor = "text-rose-600";
  if (color === "blue" || color === "sky") textColor = "text-sky-600";
  if (color === "auto") textColor = value >= 0 ? "text-emerald-600" : "text-rose-600";

  return (
    <div className="flex flex-col p-2 rounded-lg hover:bg-slate-50 transition-colors">
      <span className="text-slate-500 text-xs uppercase mb-1 truncate" title={label}>{label}</span>
      <span className={`text-lg ${bold ? 'font-extrabold' : 'font-medium'} ${textColor} truncate`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
};

export default SummaryDashboard;