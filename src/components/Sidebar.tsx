import React from 'react';
import { LayoutDashboard, Users, Settings, LogOut, Menu, X, BarChart3, FileSpreadsheet, Wallet, UserCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentView: string;
  onViewChange: (view: string) => void;
  userAccess: string;
  onLogout: () => void;
  profileImage?: string;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: BarChart3, label: 'Reports', id: 'reports' },
  { icon: FileSpreadsheet, label: 'MarkSheet', id: 'marksheet' },
  { icon: Wallet, label: 'Payment Tracking', id: 'paymentsheet' },
  { icon: Users, label: 'Users', id: 'users' },
  { icon: UserCircle, label: 'Profile', id: 'profile' },
  { icon: Settings, label: 'Branche&Examiner', id: 'settings' },
];

export function Sidebar({ isOpen, setIsOpen, currentView, onViewChange, userAccess, onLogout, profileImage }: SidebarProps) {
  const filteredNavItems = navItems.filter(item => {
    if (userAccess === 'Full') return true;
    const allowedItems = userAccess.split(',').map(i => i.trim().toLowerCase());
    return allowedItems.some(allowed => 
      allowed === item.label.toLowerCase() || 
      allowed === item.id.toLowerCase() ||
      allowed.startsWith(item.label.toLowerCase() + "'") ||
      allowed.startsWith(item.id.toLowerCase() + "'")
    );
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 bottom-0 w-64 bg-slate-900 text-white z-50 transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center overflow-hidden">
              <img src="https://play-lh.googleusercontent.com/IiCTqE_rB6y1nQlZ-AJIQA0_vyX2V0bjp0KyeSg0X12OVCE6odidw_yFf-YyYjUY0cye" alt="Logo" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
            </div>
            <span className="font-bold text-lg tracking-tight">Mark & Payment</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="p-2 space-y-1">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-2 py-1 rounded-xl transition-colors cursor-pointer",
                currentView === item.id 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              {item.id === 'profile' && profileImage ? (
                <img src={profileImage} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <item.icon size={20} />
              )}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-slate-800 flex items-center justify-between">
          <button 
            onClick={onLogout}
            className="flex-1 flex items-center gap-3 px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
          <span className="text-xs text-slate-500 font-medium px-2">Version: 4.5</span>
        </div>
      </aside>
    </>
  );
}
