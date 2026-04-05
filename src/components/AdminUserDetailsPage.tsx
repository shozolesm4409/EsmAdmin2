import React from 'react';
import { AdminUserRecord, AdminUser } from '../types';
import { ArrowLeft, Shield, User, Settings, Hash } from 'lucide-react';

interface AdminUserDetailsPageProps {
  user: AdminUserRecord;
  admin: AdminUser | null;
  onBack: () => void;
}

export function AdminUserDetailsPage({ user, admin, onBack }: AdminUserDetailsPageProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-semibold">
        <ArrowLeft size={20} />
        Back to User Management
      </button>

      <h2 className="text-2xl font-bold text-slate-900 mb-6">Admin User Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <User size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">User Name</p>
            <p className="text-lg font-bold text-slate-900">{user.userName}</p>
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <Hash size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">User ID</p>
            <p className="text-lg font-bold text-slate-900">{user.userId}</p>
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Role</p>
            <p className="text-lg font-bold text-slate-900">{user.role}</p>
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <Settings size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Status</p>
            <p className={`text-lg font-bold ${user.status === 'Active' ? 'text-emerald-600' : 'text-red-600'}`}>{user.status}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-xl">
        <h4 className="text-sm font-bold text-slate-900 mb-3">Access Sidebar</h4>
        <p className="text-sm text-slate-700 bg-white p-4 rounded-lg border border-slate-200">{user.accessSidebar}</p>
      </div>
    </div>
  );
}
