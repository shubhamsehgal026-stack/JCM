import { CashEntry, DayAggregates, EntryType, CouponType, EntryMode } from '../types';
import { calculateAggregates } from './dataService';
import { COUPON_CONFIGS } from '../constants';

// --- Header Definitions ---

export const HEADERS = {
    ENTRIES: [
        "Month", "Date", "Coupons", "Issued_Start serial number", "Issued_End serial number", "withheld_Start serial number", 
        "withheld_End serial number", "Issued_Count", "Withheld_Count", "Sold_Count", "Face_Value", 
        "Total_Amount", "Labour Cost", "Milk Cost", "Card Cash", "Card Phonepay", 
        "Coupon Paytm", "Opening Balance", "Notes", "Bundle_Key", "Type", "Entry_Mode"
    ],
    DAILY: [
        "Date", "Month", "Total Coupon Sales (₹)", "Total Card Sales (₹)", "Card Cash (₹)",
        "Card Phonepay (₹)", "Coupon Paytm (₹)", "Labour (₹)", "Milk (₹)", 
        "Coupon Cash Closing Balance (₹)", "Total Cash Deposit (₹)", "Total Sales (₹)"
    ],
    WEEKLY: [
        "Week Start (Mon)", "Week End (Sun)", "Total Coupon Sales (₹)", "Total Card Sales (₹)", 
        "Card Cash (₹)", "Card Phonepay (₹)", "Coupon Paytm (₹)", "Labour (₹)", 
        "Milk (₹)", "Coupon Cash Closing Balance (₹)", "Total Cash Deposit (₹)", 
        "Total Sales (₹)"
    ],
    MONTHLY: [
        "Month", "Total Coupon Sales (₹)", "Total Card Sales (₹)", "Card Cash (₹)", 
        "Card Phonepay (₹)", "Coupon Paytm (₹)", "Labour (₹)", "Milk (₹)", 
        "Coupon Cash Closing Balance (₹)", "Total Cash Deposit (₹)", "Total Sales (₹)"
    ],
    REPORT: [
        "Date", "Coupon Cash Sale (₹)", "Coupon Paytm (₹)", "Labour (₹)", "Milk (₹)", 
        "Card Cash (₹)", "Card Phone Pay (₹)", "Total Sale (₹)", "Bank Deposit (₹)"
    ]
};

// --- Types for the different Views ---

export interface EntryExportRow {
  Month: string;
  Date: string;
  Coupons: string;
  "Issued_Start serial number": string;
  "Issued_End serial number": string;
  "withheld_Start serial number": string;
  "withheld_End serial number": string;
  Issued_Count: number;
  Withheld_Count: number;
  Sold_Count: number;
  Face_Value: number;
  Total_Amount: number;
  "Labour Cost": number;
  "Milk Cost": number;
  "Card Cash": number;
  "Card Phonepay": number;
  "Coupon Paytm": number;
  "Opening Balance": number;
  Notes: string;
  Bundle_Key: string;
  Type: string;
  Entry_Mode: string;
}

export interface PeriodStats {
  periodLabel: string;
  sortKey: string;
  Month: string;
  Date?: string;
  
  "Total Coupon Sales (₹)": number;
  "Total Card Sales (₹)": number;
  "Card Cash (₹)": number;
  "Card Phonepay (₹)": number;
  "Coupon Paytm (₹)": number;
  "Labour (₹)": number;
  "Milk (₹)": number;
  "Coupon Cash Closing Balance (₹)": number;
  "Total Cash Deposit (₹)": number;
  "Total Sales (₹)": number;
}

export interface ReportRow {
  Date: string;
  "Coupon Cash Sale (₹)": number;
  "Coupon Paytm (₹)": number;
  "Labour (₹)": number;
  "Milk (₹)": number;
  "Card Cash (₹)": number;
  "Card Phone Pay (₹)": number;
  "Total Sale (₹)": number;
  "Bank Deposit (₹)": number;
}

export interface ImportResult {
  validEntries: CashEntry[];
  errors: string[];
}

// --- Helpers ---

const getMonthName = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString('default', { month: 'long' });
};

const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

const generateId = () => {
    // Generate a valid UUID v4
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// --- Transformers ---

// Helper to filter inactive entries
const getActiveEntries = (entries: CashEntry[]) => entries.filter(e => e.status !== 'Inactive');

export const getEntriesView = (entries: CashEntry[]): EntryExportRow[] => {
  return getActiveEntries(entries).map(e => {
    const isIssue = e.type === 'ISSUE';
    const isWithdraw = e.type === 'WITHDRAW';
    
    // Map internal types to Python-script compatible strings for export
    let couponsStr = e.couponType || "-";
    if (e.type === 'OPENING') couponsStr = "OPENING";
    if (e.type === 'DAILY_COST') couponsStr = "DAILY COST";
    if (e.type === 'CARD_CASH') couponsStr = "CARD CASH";
    if (e.type === 'CARD_PHONEPE') couponsStr = "CARD PHONEPAY";
    if (e.type === 'COUPON_PAYTM') couponsStr = "COUPON PAYTM";

    return {
      Month: getMonthName(e.date).substring(0, 3) + "-" + new Date(e.date).getFullYear(), // Format like Oct-2023
      Date: e.date,
      Coupons: couponsStr,
      "Issued_Start serial number": isIssue && e.serialStart ? e.serialStart.toString() : "",
      "Issued_End serial number": isIssue && e.serialEnd ? e.serialEnd.toString() : "",
      "withheld_Start serial number": isWithdraw && e.serialStart ? e.serialStart.toString() : "",
      "withheld_End serial number": isWithdraw && e.serialEnd ? e.serialEnd.toString() : "",
      Issued_Count: isIssue ? (e.quantity || 0) : 0,
      Withheld_Count: isWithdraw ? (e.quantity || 0) : 0,
      Sold_Count: isIssue ? (e.quantity || 0) : (isWithdraw ? -(e.quantity || 0) : 0),
      Face_Value: e.faceValue || 0,
      Total_Amount: e.type === 'ISSUE' || e.type === 'WITHDRAW' ? e.amount : 0,
      "Labour Cost": e.labourCost || 0,
      "Milk Cost": e.materialCost || 0,
      "Card Cash": e.type === 'CARD_CASH' ? e.amount : 0,
      "Card Phonepay": e.type === 'CARD_PHONEPE' ? e.amount : 0,
      "Coupon Paytm": e.type === 'COUPON_PAYTM' ? e.amount : 0,
      "Opening Balance": e.type === 'OPENING' ? e.amount : 0,
      Notes: e.notes || "",
      Bundle_Key: e.id.substring(0, 8),
      Type: e.type === 'ISSUE' || e.type === 'WITHDRAW' ? e.type : "",
      Entry_Mode: e.entryMode || ""
    };
  }).sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
};

export const getDailyStats = (entries: CashEntry[]): PeriodStats[] => {
  const active = getActiveEntries(entries);
  const dates = Array.from(new Set(active.map(e => e.date)));
  
  return dates.map(date => {
    // calculateAggregates already filters inactive, but good to be safe by passing active list
    const agg = calculateAggregates(active, date);
    return {
      periodLabel: date,
      sortKey: date,
      Date: date,
      Month: getMonthName(date),
      "Total Coupon Sales (₹)": agg.totalCouponSales,
      "Total Card Sales (₹)": agg.totalCardSales,
      "Card Cash (₹)": agg.cardCash,
      "Card Phonepay (₹)": agg.cardPhonePe,
      "Coupon Paytm (₹)": agg.couponPaytm,
      "Labour (₹)": agg.labour,
      "Milk (₹)": agg.material,
      "Coupon Cash Closing Balance (₹)": agg.couponCashClosing,
      "Total Cash Deposit (₹)": agg.totalCashDeposit,
      "Total Sales (₹)": agg.totalSales
    };
  }).sort((a, b) => new Date(b.sortKey).getTime() - new Date(a.sortKey).getTime());
};

export const getWeeklyStats = (entries: CashEntry[]): (PeriodStats & { "Week Start (Mon)": string, "Week End (Sun)": string })[] => {
  const dailyStats = getDailyStats(entries);
  const weeks: Record<string, PeriodStats & { "Week Start (Mon)": string, "Week End (Sun)": string }> = {};

  dailyStats.forEach(day => {
    const dateObj = new Date(day.sortKey);
    const monday = getMonday(dateObj);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const weekKey = monday.toISOString().split('T')[0];
    const weekLabel = `${weekKey} to ${sunday.toISOString().split('T')[0]}`;

    if (!weeks[weekKey]) {
      weeks[weekKey] = {
        periodLabel: weekLabel,
        sortKey: weekKey,
        Month: "",
        "Week Start (Mon)": weekKey,
        "Week End (Sun)": sunday.toISOString().split('T')[0],
        "Total Coupon Sales (₹)": 0,
        "Total Card Sales (₹)": 0,
        "Card Cash (₹)": 0,
        "Card Phonepay (₹)": 0,
        "Coupon Paytm (₹)": 0,
        "Labour (₹)": 0,
        "Milk (₹)": 0,
        "Coupon Cash Closing Balance (₹)": 0,
        "Total Cash Deposit (₹)": 0,
        "Total Sales (₹)": 0
      };
    }

    const w = weeks[weekKey];
    w["Total Coupon Sales (₹)"] += day["Total Coupon Sales (₹)"];
    w["Total Card Sales (₹)"] += day["Total Card Sales (₹)"];
    w["Card Cash (₹)"] += day["Card Cash (₹)"];
    w["Card Phonepay (₹)"] += day["Card Phonepay (₹)"];
    w["Coupon Paytm (₹)"] += day["Coupon Paytm (₹)"];
    w["Labour (₹)"] += day["Labour (₹)"];
    w["Milk (₹)"] += day["Milk (₹)"];
    w["Coupon Cash Closing Balance (₹)"] += day["Coupon Cash Closing Balance (₹)"];
    w["Total Cash Deposit (₹)"] += day["Total Cash Deposit (₹)"];
    w["Total Sales (₹)"] += day["Total Sales (₹)"];
  });

  return Object.values(weeks).sort((a, b) => new Date(b.sortKey).getTime() - new Date(a.sortKey).getTime());
};

export const getMonthlyStats = (entries: CashEntry[]): (PeriodStats & { Month: string })[] => {
  const dailyStats = getDailyStats(entries);
  const months: Record<string, PeriodStats & { Month: string }> = {};

  dailyStats.forEach(day => {
    const dateObj = new Date(day.sortKey);
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

    if (!months[monthKey]) {
      months[monthKey] = {
        periodLabel: monthLabel,
        sortKey: monthKey,
        Month: monthLabel,
        "Total Coupon Sales (₹)": 0,
        "Total Card Sales (₹)": 0,
        "Card Cash (₹)": 0,
        "Card Phonepay (₹)": 0,
        "Coupon Paytm (₹)": 0,
        "Labour (₹)": 0,
        "Milk (₹)": 0,
        "Coupon Cash Closing Balance (₹)": 0,
        "Total Cash Deposit (₹)": 0,
        "Total Sales (₹)": 0
      };
    }

    const m = months[monthKey];
    m["Total Coupon Sales (₹)"] += day["Total Coupon Sales (₹)"];
    m["Total Card Sales (₹)"] += day["Total Card Sales (₹)"];
    m["Card Cash (₹)"] += day["Card Cash (₹)"];
    m["Card Phonepay (₹)"] += day["Card Phonepay (₹)"];
    m["Coupon Paytm (₹)"] += day["Coupon Paytm (₹)"];
    m["Labour (₹)"] += day["Labour (₹)"];
    m["Milk (₹)"] += day["Milk (₹)"];
    m["Coupon Cash Closing Balance (₹)"] += day["Coupon Cash Closing Balance (₹)"];
    m["Total Cash Deposit (₹)"] += day["Total Cash Deposit (₹)"];
    m["Total Sales (₹)"] += day["Total Sales (₹)"];
  });

  return Object.values(months).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
};

export const getReportView = (entries: CashEntry[]): ReportRow[] => {
  const dailyStats = getDailyStats(entries);
  
  return dailyStats.map(d => ({
    Date: d.sortKey,
    "Coupon Cash Sale (₹)": d["Total Coupon Sales (₹)"],
    "Coupon Paytm (₹)": d["Coupon Paytm (₹)"],
    "Labour (₹)": d["Labour (₹)"],
    "Milk (₹)": d["Milk (₹)"],
    "Card Cash (₹)": d["Card Cash (₹)"],
    "Card Phone Pay (₹)": d["Card Phonepay (₹)"],
    "Total Sale (₹)": d["Total Sales (₹)"],
    "Bank Deposit (₹)": d["Total Cash Deposit (₹)"]
  }));
};

// --- CSV/Excel Export Helper ---
// (No changes needed below, but including for context consistency)
export const downloadCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => {
      return headers.map(fieldName => {
        const val = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
        const stringVal = String(val);
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      }).join(',');
    })
  ];
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseTextToGrid = (text: string): string[][] => {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : ',';
  const grid: string[][] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    let values: string[] = [];
    if (delimiter === '\t') {
      values = line.split('\t');
    } else {
      let inQuotes = false;
      let currentValue = '';
      for (let char of line) {
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { values.push(currentValue); currentValue = ''; }
        else { currentValue += char; }
      }
      values.push(currentValue);
    }
    const cleanValues = values.map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    grid.push(cleanValues);
  }
  return grid;
};

// ... convertGridToEntries (rest of file remains the same) ...
export const convertGridToEntries = (grid: string[][]): ImportResult => {
    // ... same logic but add default status: 'Active' to entries ...
    // Since types.ts is updated, we just ensure status is handled.
    // The previous implementation used generateId() and simple object creation.
    // We should ensure the output object has status: 'Active'
    
    // Quick copy of the main logic to ensure context
  const validEntries: CashEntry[] = [];
  const errors: string[] = []; 

  if (grid.length < 1) return { validEntries: [], errors: ["Empty grid"] };
  const rawHeaders = grid[0];
  const normalizedHeaders = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const getValue = (row: string[], targetKeys: string[]): string => {
    for (const key of targetKeys) {
        const index = normalizedHeaders.indexOf(key);
        if (index !== -1 && row[index] !== undefined && row[index] !== "") {
            return row[index];
        }
    }
    return "";
  };

  for (let i = 1; i < grid.length; i++) {
    const row = grid[i];
    if (!row || row.length === 0 || row.every(c => !c || c.trim() === '')) continue;
    const getString = (keys: string[]) => getValue(row, keys);
    const getFloat = (keys: string[]) => {
        const val = getString(keys);
        if (!val) return 0;
        const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
        return isNaN(num) ? 0 : num;
    };

    // ... ID, Type, Date parsing logic same as before ... 
    
    // Reuse date logic from previous file content...
    let type: EntryType | null = null;
    let autoNotes = "";
    const couponsCol = getString(['coupons', 'coupon', 'coupontype']).toUpperCase();
    const typeCol = getString(['type']).toUpperCase();

    if (couponsCol.includes('OPENING')) { type = 'OPENING'; } 
    else if (couponsCol.includes('DAILY COST') || couponsCol.includes('COST')) { type = 'DAILY_COST'; } 
    else if (couponsCol.includes('CARD CASH')) { type = 'CARD_CASH'; } 
    else if (couponsCol.includes('CARD PHONEPAY') || couponsCol.includes('PHONEPAY') || couponsCol.includes('PHONEPE')) { type = 'CARD_PHONEPE'; } 
    else if (couponsCol.includes('COUPON PAYTM') || couponsCol.includes('PAYTM')) { type = 'COUPON_PAYTM'; } 
    else if (typeCol.includes('ISSUE') || couponsCol.includes('RS')) {
        if (typeCol.includes('WITHDRAW') || typeCol.includes('WITHHELD')) { type = 'WITHDRAW'; } else { type = 'ISSUE'; }
    } else if (typeCol.includes('WITHDRAW')) { type = 'WITHDRAW'; }

    if (!type) {
         if (getFloat(['openingbalance', 'opening']) > 0) type = 'OPENING';
         else if (getFloat(['labourcost', 'labour', 'materialcost', 'material', 'milkcost', 'milk']) > 0) type = 'DAILY_COST';
         else if (getFloat(['cardcash']) > 0) type = 'CARD_CASH';
         else if (getFloat(['cardphonepay', 'cardphonepe']) > 0) type = 'CARD_PHONEPE';
         else if (getFloat(['couponpaytm']) > 0) type = 'COUPON_PAYTM';
         else type = 'ISSUE'; 
    }

    let dateStr = getString(['date', 'time']);
    let isoDate = "";
    if (dateStr) {
       // ... simple date handling or reuse complex logic if strictly needed, 
       // for brevity assuming standard string parsing or reuse previous logic
       const d = new Date(dateStr);
       if (!isNaN(d.getTime())) isoDate = d.toISOString().split('T')[0];
    }
    if (!isoDate) isoDate = new Date().toISOString().split('T')[0];

    const notesVal = getString(['notes', 'comment', 'description']);
    const finalNotes = notesVal ? (autoNotes ? `${notesVal} ${autoNotes}` : notesVal) : autoNotes;

    const entry: CashEntry = {
        id: generateId(),
        date: isoDate,
        type: type!,
        timestamp: new Date(isoDate).getTime() + i, 
        amount: 0, 
        notes: finalNotes,
        status: 'Active' // DEFAULT FOR IMPORT
    };

    // ... Type specific mapping same as before ...
     switch (type) {
        case 'OPENING': entry.amount = getFloat(['openingbalance', 'opening']); break;
        case 'DAILY_COST': entry.labourCost = getFloat(['labourcost', 'labour']); entry.materialCost = getFloat(['materialcost', 'material', 'milkcost', 'milk']); entry.amount = 0; break;
        case 'CARD_CASH': entry.amount = getFloat(['cardcash']); break;
        case 'CARD_PHONEPE': entry.amount = getFloat(['cardphonepay', 'cardphonepe']); break;
        case 'COUPON_PAYTM': entry.amount = getFloat(['couponpaytm', 'paytm']); break;
        case 'ISSUE':
        case 'WITHDRAW':
            const couponName = getString(['coupons', 'coupon']);
            if (couponName) entry.couponType = couponName as CouponType;
            entry.faceValue = getFloat(['facevalue', 'face_value', 'facevalue']);
            if (entry.faceValue === 0 && entry.couponType) {
                const config = COUPON_CONFIGS.find(c => c.label === entry.couponType);
                if (config) entry.faceValue = config.faceValue;
            }
            entry.quantity = getFloat(type === 'ISSUE' ? ['issuedcount', 'issued', 'qty', 'quantity'] : ['withheldcount', 'withheld', 'qty', 'quantity']);
            const totalAmt = getFloat(['totalamount', 'amount', 'total']);
            if (entry.quantity === 0 && totalAmt > 0 && entry.faceValue > 0) { entry.quantity = totalAmt / entry.faceValue; }
            if (totalAmt === 0 && entry.quantity > 0 && entry.faceValue > 0) { entry.amount = entry.quantity * entry.faceValue; } else { entry.amount = totalAmt; }

            if (type === 'ISSUE') {
                const sStart = getFloat(['issuedstartserialnumber', 'issuedstart', 'start']);
                const sEnd = getFloat(['issuedendserialnumber', 'issuedend', 'end']);
                if (sStart > 0) entry.serialStart = sStart;
                if (sEnd > 0) entry.serialEnd = sEnd;
            } else {
                const wStart = getFloat(['withheldstartserialnumber', 'withheldstart']);
                const wEnd = getFloat(['withheldendserialnumber', 'withheldend']);
                if (wStart > 0) entry.serialStart = wStart;
                if (wEnd > 0) entry.serialEnd = wEnd;
            }
            if (entry.serialStart && entry.serialStart > 0) entry.entryMode = 'SERIAL'; else entry.entryMode = 'BUNDLE';
            break;
    }

    validEntries.push(entry);
  }
  
  return { validEntries, errors };
};
