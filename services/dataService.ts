import { supabase } from './supabaseClient';
import { CashEntry, DayAggregates } from '../types';

// --- MAPPING HELPERS (CamelCase JS <-> Snake_Case DB) ---

const toDb = (entry: CashEntry) => ({
  id: entry.id,
  date: entry.date,
  type: entry.type,
  coupon_type: entry.couponType || null,
  amount: entry.amount,
  face_value: entry.faceValue || null,
  quantity: entry.quantity || null,
  serial_start: entry.serialStart || null,
  serial_end: entry.serialEnd || null,
  labour_cost: entry.labourCost || null,
  material_cost: entry.materialCost || null,
  notes: entry.notes || null,
  entry_mode: entry.entryMode || null,
  timestamp: entry.timestamp,
  status: entry.status || 'Active'
});

const fromDb = (row: any): CashEntry => ({
  id: row.id,
  date: row.date,
  type: row.type,
  couponType: row.coupon_type,
  amount: row.amount,
  faceValue: row.face_value,
  quantity: row.quantity,
  serialStart: row.serial_start,
  serialEnd: row.serial_end,
  labourCost: row.labour_cost,
  materialCost: row.material_cost,
  notes: row.notes,
  entryMode: row.entry_mode,
  timestamp: Number(row.timestamp),
  status: row.status || 'Active'
});

// --- FETCHING ---

export const fetchEntries = async (): Promise<CashEntry[]> => {
  // Fetch ALL entries (Active and Inactive) so the UI can manage them
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching entries:', error);
    throw error;
  }
  return (data || []).map(fromDb);
};

export const fetchInactiveEntries = async (): Promise<CashEntry[]> => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('status', 'Inactive')
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching inactive entries:', error);
    throw error;
  }
  return (data || []).map(fromDb);
};

// --- CREATION & UPDATES ---

export const createEntry = async (entry: CashEntry) => {
  const { error } = await supabase
    .from('entries')
    .insert([toDb(entry)]);

  if (error) {
    console.error('Error creating entry:', error);
    throw error;
  }
};

export const updateEntryDb = async (entry: CashEntry) => {
  const { error } = await supabase
    .from('entries')
    .update(toDb(entry))
    .eq('id', entry.id);

  if (error) {
    console.error('Error updating entry:', error);
    throw error;
  }
};

export const bulkCreateEntries = async (entries: CashEntry[]) => {
  const dbEntries = entries.map(toDb);
  const { error } = await supabase
    .from('entries')
    .insert(dbEntries);

  if (error) {
    console.error('Error bulk creating entries:', error);
    throw error;
  }
};

// --- STATUS MANAGEMENT ---

export const setEntryStatus = async (id: string, status: 'Active' | 'Inactive') => {
  const { error } = await supabase
    .from('entries')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error(`Error setting status to ${status}:`, error);
    throw error;
  }
};

export const moveToInactive = async (entry: CashEntry) => {
  await setEntryStatus(entry.id, 'Inactive');
};

export const moveToActive = async (entry: CashEntry) => {
  await setEntryStatus(entry.id, 'Active');
};

export const archiveAllEntries = async (entries: CashEntry[]) => {
  const ids = entries.map(e => e.id);
  const { error } = await supabase
    .from('entries')
    .update({ status: 'Inactive' })
    .in('id', ids);

  if (error) {
    console.error('Error archiving all entries:', error);
    throw error;
  }
};

// --- AGGREGATION (Client-Side) ---

export const calculateAggregates = (entries: CashEntry[], dateStr: string): DayAggregates => {
  const dayEntries = entries.filter(e => e.date === dateStr && e.status === 'Active');

  let opening = 0;
  let couponSales = 0;
  let cardCash = 0;
  let cardPhonePe = 0;
  let couponPaytm = 0;
  let labour = 0;
  let material = 0;

  dayEntries.forEach(e => {
    switch (e.type) {
      case 'OPENING':
        opening += e.amount;
        break;
      case 'ISSUE':
        couponSales += e.amount;
        break;
      case 'WITHDRAW':
        couponSales -= Math.abs(e.amount);
        break;
      case 'CARD_CASH':
        cardCash += e.amount;
        break;
      case 'CARD_PHONEPE':
        cardPhonePe += e.amount;
        break;
      case 'COUPON_PAYTM':
        couponPaytm += e.amount;
        break;
      case 'DAILY_COST':
        labour += (e.labourCost || 0);
        material += (e.materialCost || 0);
        break;
    }
  });

  const totalCouponSales = opening + couponSales;
  const totalCardSales = cardCash + cardPhonePe;
  const totalSales = totalCouponSales + totalCardSales;
  const couponCashClosing = totalCouponSales - (couponPaytm + labour + material);
  const totalCashDeposit = couponCashClosing + cardCash;

  return {
    totalCouponSales,
    cardCash,
    cardPhonePe,
    totalCardSales,
    couponPaytm,
    labour,
    material,
    couponCashClosing,
    totalCashDeposit,
    totalSales
  };
};