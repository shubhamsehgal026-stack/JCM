import { ChevronLeft, ChevronRight, Calendar, LogOut, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { APP_TITLE } from '../constants';
import Logo from './Logo';

const Header = () => {
  const { currentDate, setCurrentDate, currentUser, logout } = useApp();

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 w-full">
        
        {/* Brand */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <div>
               <h1 className="text-lg md:text-xl font-bold text-rose-600 leading-tight">
                  {APP_TITLE}
               </h1>
               <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                  <User size={12} />
                  <span>Logged in as: <span className="text-slate-800">{currentUser}</span></span>
               </div>
            </div>
          </div>
          
          {/* Mobile Logout (visible only on small screens next to logo) */}
          <button 
            onClick={logout}
            className="md:hidden p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Date Navigator */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-1 w-full md:w-auto">
            <button 
              onClick={handlePrevDay}
              className="p-2 hover:bg-white hover:shadow rounded-md transition-all text-slate-600 hover:text-sky-600 flex-shrink-0"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center justify-center px-2 sm:px-4 gap-2 border-x border-slate-200 mx-1 flex-1">
              <Calendar size={18} className="text-slate-500 flex-shrink-0" />
              <input 
                type="date" 
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 font-bold text-slate-800 w-full text-center min-w-[110px]"
              />
            </div>

            <button 
              onClick={handleNextDay}
              className="p-2 hover:bg-white hover:shadow rounded-md transition-all text-slate-600 hover:text-sky-600 flex-shrink-0"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Desktop Logout */}
          <button 
            onClick={logout}
            className="hidden md:block p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;