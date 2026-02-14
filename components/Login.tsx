import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Logo from './Logo';
import { User, CheckCircle2, ShieldCheck } from 'lucide-react';

const ADMIN_USER = { name: 'Admin', pass: 'Admin@123' };
const STAFF_USERS = [
  { name: 'Ashish', pass: 'Ashish@1232' },
  { name: 'Shubham', pass: 'Shubham@1233' },
];

interface UserButtonProps {
  user: { name: string; pass: string };
  isAdmin?: boolean;
  selectedUsername: string;
  onSelect: (name: string, pass: string) => void;
}

const UserButton: React.FC<UserButtonProps> = ({ user, isAdmin = false, selectedUsername, onSelect }) => {
  const isSelected = selectedUsername === user.name;
  
  return (
    <button
      type="button"
      onClick={() => onSelect(user.name, user.pass)}
      className={`
        relative rounded-xl border-2 transition-all p-4 group
        ${isSelected 
          ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-md transform scale-[1.02] z-10' 
          : 'border-slate-100 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50'
        }
        ${isAdmin ? 'w-full flex items-center justify-center gap-3' : 'flex flex-col items-center justify-center'}
      `}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 text-sky-500 animate-fade-in">
          <CheckCircle2 size={16} />
        </div>
      )}
      
      <div className={`p-3 rounded-full transition-colors ${isSelected ? 'bg-sky-100' : 'bg-slate-50 shadow-sm group-hover:bg-sky-100'} ${isAdmin ? '' : 'mb-2'}`}>
        {isAdmin ? (
          <ShieldCheck size={24} className={isSelected ? 'text-sky-600' : 'text-slate-400 group-hover:text-sky-500'} />
        ) : (
          <User size={24} className={isSelected ? 'text-sky-600' : 'text-slate-400 group-hover:text-sky-500'} />
        )}
      </div>
      
      <span className="font-bold text-sm">{user.name}</span>
    </button>
  );
};

const Login: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleUserSelect = (name: string, pass: string) => {
    setUsername(name);
    setPassword(pass);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(username, password);
    if (!success) {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-sky-100 w-full max-w-lg animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <Logo size={60} />
          <h1 className="text-2xl font-bold text-sky-900 mt-4">Jalpan Services</h1>
          <p className="text-sky-600 text-sm">Select User to Login</p>
        </div>

        {/* User Selection */}
        <div className="mb-8 space-y-4">
            {/* Admin Row - Full Width */}
            <div>
                 <UserButton 
                    user={ADMIN_USER} 
                    isAdmin={true} 
                    selectedUsername={username}
                    onSelect={handleUserSelect}
                 />
            </div>
            
            {/* Staff Grid - 2 Columns */}
            <div>
                 <div className="grid grid-cols-2 gap-4">
                    {STAFF_USERS.map(user => (
                        <UserButton 
                            key={user.name} 
                            user={user} 
                            selectedUsername={username}
                            onSelect={handleUserSelect}
                        />
                    ))}
                 </div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 border-t border-slate-100 pt-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
                <label className="block text-xs font-bold text-sky-700 uppercase mb-1">Username</label>
                <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field w-full border-sky-200 focus:border-sky-500"
                placeholder="Select user above"
                readOnly={STAFF_USERS.some(u => u.name === username) || username === ADMIN_USER.name} 
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-sky-700 uppercase mb-1">Password</label>
                <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full border-sky-200 focus:border-sky-500"
                placeholder="• • • • • • • •"
                />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-lg font-medium text-center animate-fade-in">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full btn-primary bg-sky-600 hover:bg-sky-700 text-white text-lg py-3 shadow-md transition-colors"
          >
            Login
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">Authorized Personnel Only</p>
        </div>
      </div>
    </div>
  );
};

export default Login;