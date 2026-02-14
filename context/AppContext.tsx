import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { CashEntry, CouponType, DayAggregates, Tab } from '../types';
import { 
  fetchEntries, 
  createEntry, 
  updateEntryDb, 
  bulkCreateEntries, 
  calculateAggregates, 
  moveToInactive,
  moveToActive,
  archiveAllEntries
} from '../services/dataService';
import { COUPON_CONFIGS } from '../constants';

interface AppContextType {
  entries: CashEntry[]; // Holds ALL entries now
  inactiveEntries: CashEntry[]; // Derived for compatibility
  loadInactiveData: () => Promise<void>; // No-op
  
  currentDate: string; // YYYY-MM-DD
  setCurrentDate: (date: string) => void;
  
  // Navigation
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;

  selectedCoupon: CouponType;
  setSelectedCoupon: (coupon: CouponType) => void;
  
  addEntry: (entry: Omit<CashEntry, 'id' | 'timestamp' | 'date' | 'status'>) => void;
  deleteLastEntry: () => void;
  deleteEntryById: (id: string) => void;
  restoreEntryById: (id: string) => void;
  updateExistingEntry: (entry: CashEntry) => void;
  archiveAllData: () => void;
  
  // Edit State
  editingEntry: CashEntry | null;
  startEditing: (entry: CashEntry) => void;
  cancelEditing: () => void;

  importData: (newEntries: CashEntry[]) => void;
  appendData: (newEntries: CashEntry[]) => void;
  aggregates: DayAggregates;
  getClosingBalance: (date: string) => number;
  statusMessage: string;
  setStatusMessage: (msg: string) => void;
  currentUser: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const USERS = [
  { username: 'Ashish', password: 'Ashish@1232' },
  { username: 'Admin', password: 'Admin@123' },
  { username: 'Shubham', password: 'Shubham@1233' },
];

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const AppProvider = ({ children }: PropsWithChildren<{}>) => {
  const [entries, setEntries] = useState<CashEntry[]>([]);
  
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [selectedCoupon, setSelectedCoupon] = useState<CouponType>(COUPON_CONFIGS[0].label);
  const [statusMessage, setStatusMessage] = useState<string>("Loading data...");
  const [editingEntry, setEditingEntry] = useState<CashEntry | null>(null);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('jalpan_user');
  });

  // Load All data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchEntries();
        setEntries(data);
        setStatusMessage("Data loaded.");
      } catch (err) {
        console.error(err);
        setStatusMessage("Error loading data.");
      }
    };
    loadData();
  }, []);

  const loadInactiveData = async () => {
    // No-op: Data is already loaded in 'entries'
  };

  const inactiveEntries = entries.filter(e => e.status === 'Inactive');

  const addEntry = async (entryData: Omit<CashEntry, 'id' | 'timestamp' | 'date' | 'status'>) => {
    setStatusMessage("Saving...");
    const newEntry: CashEntry = {
      ...entryData,
      id: generateUUID(),
      date: currentDate,
      timestamp: Date.now(),
      status: 'Active'
    };

    setEntries(prev => [...prev, newEntry]);

    try {
      await createEntry(newEntry);
      setStatusMessage("Entry saved.");
    } catch (err) {
      console.error(err);
      setStatusMessage("Error saving.");
    }
  };

  const updateExistingEntry = async (entry: CashEntry) => {
      setStatusMessage("Updating...");
      setEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
      setEditingEntry(null); 
      
      try {
          await updateEntryDb(entry);
          setStatusMessage("Entry updated.");
      } catch (err) {
          console.error(err);
          setStatusMessage("Error updating.");
      }
  };

  // Toggle to Inactive
  const deleteEntryById = async (id: string) => {
      const entry = entries.find(e => e.id === id);
      if (!entry) return;

      console.log("Setting to Inactive:", id);
      setStatusMessage("Deactivating...");

      const updated = { ...entry, status: 'Inactive' as const };
      setEntries(prev => prev.map(e => e.id === id ? updated : e));

      try {
          await moveToInactive(entry);
          setStatusMessage("Entry marked Inactive.");
      } catch (err: any) {
          console.error("Move failed:", err);
          setStatusMessage("Error updating status.");
      }
  };

  // Toggle to Active
  const restoreEntryById = async (id: string) => {
      const entry = entries.find(e => e.id === id);
      if (!entry) return;

      console.log("Restoring to Active:", id);
      setStatusMessage("Activating...");

      const updated = { ...entry, status: 'Active' as const };
      setEntries(prev => prev.map(e => e.id === id ? updated : e));

      try {
          await moveToActive(entry);
          setStatusMessage("Entry restored.");
      } catch (err) {
          console.error("Restore failed:", err);
          setStatusMessage("Error restoring.");
      }
  }

  const archiveAllData = async () => {
    if(!window.confirm("Are you sure you want to mark ALL current active entries as Inactive?")) {
      return;
    }

    const activeEntries = entries.filter(e => e.status !== 'Inactive');
    if (activeEntries.length === 0) {
        alert("No active entries to archive.");
        return;
    }

    setStatusMessage("Archiving all data...");
    
    // Optimistic Update
    setEntries(prev => prev.map(e => ({ ...e, status: 'Inactive' as const })));

    try {
      await archiveAllEntries(activeEntries);
      setStatusMessage("All data archived.");
    } catch(err) {
      console.error(err);
      setStatusMessage("Error archiving data.");
      // Rollback not easily possible without reload here, simpliest is reload
      window.location.reload();
    }
  }

  const deleteLastEntry = async () => {
    const todayActive = entries.filter(e => e.date === currentDate && e.status === 'Active');
    if (todayActive.length === 0) {
      setStatusMessage("No active entries found for today.");
      alert("No active entries found for today.");
      return;
    }

    const lastEntry = [...todayActive].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
    
    if (lastEntry) {
        await deleteEntryById(lastEntry.id);
    }
  };

  const startEditing = (entry: CashEntry) => {
      setEditingEntry(entry);
      switch(entry.type) {
          case 'ISSUE': setActiveTab('ISSUE'); break;
          case 'WITHDRAW': setActiveTab('WITHDRAW'); break;
          case 'OPENING': setActiveTab('OPENING_BALANCE'); break;
          case 'DAILY_COST': setActiveTab('DAILY_COST'); break;
          case 'CARD_CASH': setActiveTab('CARD_SALES'); break;
          case 'CARD_PHONEPE': setActiveTab('CARD_SALES'); break;
          case 'COUPON_PAYTM': setActiveTab('COUPON_PAYTM'); break;
          default: setActiveTab('DASHBOARD');
      }
      if (entry.couponType) {
          setSelectedCoupon(entry.couponType);
      }
  };

  const cancelEditing = () => {
      setEditingEntry(null);
  };

  const importData = async (newEntries: CashEntry[]) => {
    if (!window.confirm("This will archive ALL existing data and import new data. Are you sure?")) {
        return;
    }

    setStatusMessage("Archiving & Importing...");
    try {
        await archiveAllEntries(entries);
        await bulkCreateEntries(newEntries);
        
        // Refresh
        const all = await fetchEntries();
        setEntries(all);
        
        setStatusMessage(`Imported ${newEntries.length} entries.`);
    } catch (err) {
        console.error(err);
        setStatusMessage("Error during import.");
    }
  };

  const appendData = async (newEntries: CashEntry[]) => {
    setStatusMessage("Appending data...");
    try {
        await bulkCreateEntries(newEntries);
        setEntries(prev => [...prev, ...newEntries]);
        setStatusMessage(`Appended ${newEntries.length} entries.`);
    } catch (err) {
        console.error(err);
        setStatusMessage("Error appending data.");
    }
  };

  const login = (username: string, password: string): boolean => {
    const user = USERS.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user.username);
      localStorage.setItem('jalpan_user', user.username);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('jalpan_user');
  };

  const getClosingBalance = (dateStr: string): number => {
    const stats = calculateAggregates(entries, dateStr);
    return stats.couponCashClosing;
  };

  const aggregates = calculateAggregates(entries, currentDate);

  return (
    <AppContext.Provider value={{
      entries,
      inactiveEntries,
      loadInactiveData,
      currentDate,
      setCurrentDate,
      activeTab,
      setActiveTab,
      selectedCoupon,
      setSelectedCoupon,
      addEntry,
      deleteLastEntry,
      deleteEntryById,
      restoreEntryById,
      updateExistingEntry,
      archiveAllData, 
      editingEntry,
      startEditing,
      cancelEditing,
      importData,
      appendData,
      aggregates,
      getClosingBalance,
      statusMessage,
      setStatusMessage,
      currentUser,
      login,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};