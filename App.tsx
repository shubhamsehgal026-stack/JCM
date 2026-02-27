import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import CouponSelector from './components/CouponSelector';
import TransactionPanel from './components/TransactionPanel';
import DailyAdjustments from './components/DailyAdjustments';
import SummaryDashboard from './components/SummaryDashboard';
import DataManagement from './components/DataManagement';
import OpeningBalancePanel from './components/OpeningBalancePanel';
import Footer from './components/Footer';
import Login from './components/Login';
import { Tab } from './types';
import { 
  LayoutDashboard, 
  PlusCircle, 
  MinusCircle, 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  Menu,
  Database,
  Wallet
} from 'lucide-react';

const AppContent = () => {
  const { statusMessage, currentUser, activeTab, setActiveTab, cancelEditing } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // If not logged in, show Login screen
  if (!currentUser) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'DASHBOARD':
        return <SummaryDashboard />;
      case 'OPENING_BALANCE':
        return <OpeningBalancePanel />;
      case 'ISSUE':
        return (
          <TransactionPanel mode="ISSUE">
             <CouponSelector />
          </TransactionPanel>
        );
      case 'WITHDRAW':
        return (
          <TransactionPanel mode="WITHDRAW">
             <CouponSelector />
          </TransactionPanel>
        );
      case 'CARD_SALES':
        return <DailyAdjustments mode="CARD" />;
      case 'COUPON_PAYTM':
        return <DailyAdjustments mode="PAYTM" />;
      case 'DAILY_COST':
        return <DailyAdjustments mode="COST" />;
      case 'DATA_MANAGEMENT':
        return <DataManagement />;
      default:
        return <SummaryDashboard />;
    }
  };

  const NavItem = ({ tab, label, icon: Icon }: { tab: Tab; label: string; icon: any }) => (
    <button
      onClick={() => { 
        cancelEditing();
        setActiveTab(tab); 
        setIsSidebarOpen(false); 
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left font-medium transition-colors border-l-4
        ${activeTab === tab 
          ? 'bg-rose-50 border-rose-600 text-rose-700' 
          : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
    >
      <Icon size={20} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Header />
      
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 border-b border-slate-100 flex justify-between items-center md:hidden">
             <span className="font-bold text-slate-700">Menu</span>
             <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500">
                <Menu />
             </button>
          </div>
          <nav className="flex-col py-4 flex h-full overflow-y-auto">
            <NavItem tab="DASHBOARD" label="Dashboard" icon={LayoutDashboard} />
            <div className="my-2 border-t border-slate-100 mx-4"></div>
            <NavItem tab="OPENING_BALANCE" label="Opening Balance" icon={Wallet} />
            <NavItem tab="ISSUE" label="Issue Coupons" icon={PlusCircle} />
            <NavItem tab="WITHDRAW" label="Withdraw Coupons" icon={MinusCircle} />
            <div className="my-2 border-t border-slate-100 mx-4"></div>
            <NavItem tab="CARD_SALES" label="Card Sales" icon={CreditCard} />
            <NavItem tab="COUPON_PAYTM" label="Coupon Paytm" icon={Smartphone} />
            <NavItem tab="DAILY_COST" label="Daily Cost" icon={DollarSign} />
            <div className="my-2 border-t border-slate-100 mx-4"></div>
            <NavItem tab="DATA_MANAGEMENT" label="Data Management" icon={Database} />
          </nav>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-3 md:p-8 w-full">
          {/* Mobile Menu Trigger */}
          <div className="md:hidden mb-4">
             <button onClick={() => setIsSidebarOpen(true)} className="flex items-center gap-2 text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm w-full">
                <Menu size={20} /> <span className="font-bold">Open Menu</span>
             </button>
          </div>

          {/* Status Bar */}
          <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between sm:items-center bg-sky-50 px-4 py-3 rounded-lg border border-sky-200 text-sm shadow-sm gap-2">
              <span className="font-bold text-sky-800">Current View: {activeTab.replace('_', ' ')}</span>
              <span className="text-slate-500 italic text-xs sm:text-sm truncate">Last Status: {statusMessage}</span>
          </div>

          <div className="animate-fade-in">
            {renderContent()}
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
      <style>{`
        .input-field {
          padding: 0.5rem 0.75rem;
          background-color: #ffffff;
          border: 1px solid #000000;
          border-radius: 0.375rem;
          color: #000000;
          outline: none;
          transition: all 0.15s ease-in-out;
          font-weight: 500;
        }
        .input-field::placeholder {
          color: #94a3b8;
        }
        .input-field:focus {
           box-shadow: 0 0 0 2px #0ea5e9;
           border-color: #0ea5e9;
        }
        
        .btn-primary {
          color: white;
          font-weight: 700;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          transition: transform 0.1s;
          cursor: pointer;
        }
        .btn-primary:active {
          transform: scale(0.95);
        }
        
        .btn-secondary {
          background-color: #e2e8f0;
          color: #1e293b;
          font-weight: 700;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          transition: background-color 0.15s;
          cursor: pointer;
        }
        .btn-secondary:hover {
          background-color: #cbd5e1;
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }

        /* Hide spin button for Chrome, Safari, Edge, Opera */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        /* Hide spin button for Firefox */
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </AppProvider>
  );
};

export default App;