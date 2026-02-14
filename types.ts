
export type CouponType = 
  | "Rs 5"
  | "Rs 10"
  | "Rs 15"
  | "Rs 20"
  | "Rs 50"
  | "Rs 50 (Combo)"
  | "Rs 100 (Combo)";

export interface CouponConfig {
  label: CouponType;
  faceValue: number;
  bundleSize: number;
  color: string;
  textColor: string;
}

export type EntryMode = "BUNDLE" | "SERIAL";

export type EntryType = 
  | "ISSUE" 
  | "WITHDRAW" 
  | "OPENING" 
  | "DAILY_COST" 
  | "CARD_CASH" 
  | "CARD_PHONEPE" 
  | "COUPON_PAYTM";

export interface CashEntry {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  type: EntryType;
  couponType?: CouponType;
  
  // Amounts
  amount: number;
  faceValue?: number;
  
  // Specifics
  quantity?: number; // Booklets or serial count
  serialStart?: number;
  serialEnd?: number;
  
  // Cost breakdown
  labourCost?: number;
  materialCost?: number;
  
  notes?: string;
  entryMode?: EntryMode;
  timestamp: number; // For sorting
  
  // Soft Delete Status
  status?: 'Active' | 'Inactive';
}

export interface DayAggregates {
  totalCouponSales: number;
  cardCash: number;
  cardPhonePe: number;
  totalCardSales: number;
  couponPaytm: number;
  labour: number;
  material: number;
  couponCashClosing: number;
  totalCashDeposit: number;
  totalSales: number;
}

export type Tab = 'DASHBOARD' | 'OPENING_BALANCE' | 'ISSUE' | 'WITHDRAW' | 'CARD_SALES' | 'COUPON_PAYTM' | 'DAILY_COST' | 'DATA_MANAGEMENT';
