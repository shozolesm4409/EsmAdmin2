import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, User, LogOut, ChevronDown } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
  userName: string;
  userRole: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  profileImage?: string;
}

export function Navbar({ onMenuClick, userName, userRole, onViewChange, onLogout, profileImage }: NavbarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-slate-100 rounded-lg lg:hidden text-slate-600"
        >
          <Menu size={20} />
        </button>
        
        <div className="hidden md:flex items-center bg-slate-100 px-3 py-2 rounded-xl w-64 lg:w-96">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search dashboard..." 
            className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt={userName} className="w-full h-full object-cover" />
              ) : (
                initials || 'U'
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-900 leading-none">{userName}</p>
              <p className="text-xs text-slate-500 mt-1">{userRole}</p>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
              <button 
                onClick={() => { onViewChange('profile'); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User size={16} />
                Profile
              </button>
              <button 
                onClick={() => { onLogout(); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
